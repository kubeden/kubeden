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
		rate:    rate.Limit(100.0 / 60.0), // 100 requests per minute per IP
		burst:   100,                      // Allow short bursts up to the minute quota
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
	// Prefer headers that carry the original client IP when behind proxies/CDN
	headerCandidates := []string{
		r.Header.Get("CF-Connecting-IP"),
		r.Header.Get("True-Client-IP"),
		r.Header.Get("X-Forwarded-For"), // First entry is the client
		r.Header.Get("X-Real-IP"),
	}

	for _, raw := range headerCandidates {
		if ip := parseIPFromList(raw); ip != "" {
			return ip
		}
	}

	// Fall back to remote address
	if ip := normalizeIP(r.RemoteAddr); ip != "" {
		return ip
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

func parseIPFromList(raw string) string {
	if raw == "" {
		return ""
	}

	for _, candidate := range strings.Split(raw, ",") {
		if ip := normalizeIP(strings.TrimSpace(candidate)); ip != "" {
			return ip
		}
	}

	return ""
}

func normalizeIP(raw string) string {
	if raw == "" {
		return ""
	}

	if ip := net.ParseIP(raw); ip != nil {
		return ip.String()
	}

	if host, _, err := net.SplitHostPort(raw); err == nil {
		if ip := net.ParseIP(host); ip != nil {
			return ip.String()
		}
	}

	return ""
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

		// asd

		next.ServeHTTP(w, r)
	})
}

// Stop cleans up resources used by the rate limiter
func (irl *IPRateLimiter) Stop() {
	if irl.cleanup != nil {
		irl.cleanup.Stop()
	}
}
