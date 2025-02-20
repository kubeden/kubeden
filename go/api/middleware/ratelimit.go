// middleware/ratelimit.go
package middleware

import (
	"fmt"
	"net/http"
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
	// Allow 30 requests per minute with a burst of 5
	irl := &IPRateLimiter{
		ips:     make(map[string]*rate.Limiter),
		mu:      &sync.RWMutex{},
		rate:    rate.Limit(30.0 / 60.0), // 30 requests per minute
		burst:   5,
		cleanup: time.NewTicker(1 * time.Hour),
	}

	// Start cleanup routine
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
		// Get IP from X-Forwarded-For header, fallback to RemoteAddr
		ip := r.RemoteAddr
		if forwardedFor := r.Header.Get("X-Forwarded-For"); forwardedFor != "" {
			ip = forwardedFor
		}

		limiter := irl.GetLimiter(ip)

		// Add rate limit headers
		w.Header().Set("X-RateLimit-Limit", "30")
		w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%.0f", limiter.Tokens()))

		if !limiter.Allow() {
			w.Header().Set("Retry-After", "60")
			http.Error(w, "Rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (irl *IPRateLimiter) Stop() {
	irl.cleanup.Stop()
}
