// middleware/ratelimit.go
package middleware

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type IPRateLimiter struct {
	ips     map[string]*rate.Limiter
	mu      *sync.RWMutex
	rate    rate.Limit
	burst   int
	cleanup *time.Ticker
}

func NewIPRateLimiter() *IPRateLimiter {
	irl := &IPRateLimiter{
		ips:     make(map[string]*rate.Limiter),
		mu:      &sync.RWMutex{},
		rate:    rate.Limit(40.0 / 60.0), // 9 requests per minute
		burst:   3,                       // Max burst of 3
		cleanup: time.NewTicker(10 * time.Minute),
	}

	go irl.cleanupRoutine()
	return irl
}

func (irl *IPRateLimiter) cleanupRoutine() {
	for range irl.cleanup.C {
		irl.mu.Lock()
		for ip, limiter := range irl.ips {
			if limiter.Tokens() == float64(irl.burst) {
				delete(irl.ips, ip)
			}
		}
		irl.mu.Unlock()
	}
}

func (irl *IPRateLimiter) extractIP(r *http.Request) string {
	// Check X-Forwarded-For header first
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		// Get the first IP in the list
		ips := strings.Split(forwarded, ",")
		if len(ips) > 0 {
			clientIP := strings.TrimSpace(ips[0])
			if ip := net.ParseIP(clientIP); ip != nil {
				return ip.String()
			}
		}
	}

	// Check X-Real-IP header
	if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
		if ip := net.ParseIP(realIP); ip != nil {
			return ip.String()
		}
	}

	// Fall back to RemoteAddr
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		// If SplitHostPort fails, try RemoteAddr directly
		if parsedIP := net.ParseIP(r.RemoteAddr); parsedIP != nil {
			return parsedIP.String()
		}
		return "unknown" // Fallback value if everything fails
	}

	// Validate the extracted IP
	if parsedIP := net.ParseIP(ip); parsedIP != nil {
		return parsedIP.String()
	}

	return "unknown"
}

func (irl *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	irl.mu.Lock()
	defer irl.mu.Unlock()

	limiter, exists := irl.ips[ip]
	if !exists {
		limiter = rate.NewLimiter(irl.rate, irl.burst)
		irl.ips[ip] = limiter
	}

	return limiter
}

func (irl *IPRateLimiter) RateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := irl.extractIP(r)
		if ip == "unknown" {
			log.Printf("Warning: Could not determine client IP address")
			// Allow the request but log the warning
			next.ServeHTTP(w, r)
			return
		}

		limiter := irl.GetLimiter(ip)

		// Try to allow the request
		if !limiter.Allow() {
			log.Printf("Rate limit exceeded for IP: %s", ip)
			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", int(irl.rate*60)))
			w.Header().Set("X-RateLimit-Remaining", "0")
			w.Header().Set("Retry-After", "60")
			http.Error(w, "Rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
			return
		}

		// Calculate tokens remaining (subtract 1 for the current request)
		remaining := int(limiter.Tokens()) - 1
		if remaining < 0 {
			remaining = 0
		}

		// Set rate limit headers
		w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", int(irl.rate*60)))
		w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))

		next.ServeHTTP(w, r)
	})
}

// Stop cleans up resources used by the rate limiter
func (irl *IPRateLimiter) Stop() {
	if irl.cleanup != nil {
		irl.cleanup.Stop()
	}
}
