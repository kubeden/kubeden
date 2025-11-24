package middleware

import (
	"fmt"
	"net/http"
	"time"

	"golang.org/x/time/rate"
)

// GlobalRateLimiter enforces a single budget across all requests.
type GlobalRateLimiter struct {
	limiter      *rate.Limiter
	limitPerHour int
}

func NewGlobalRateLimiter() *GlobalRateLimiter {
	const (
		limitPerHour = 20000
		// Allow short spikes without breaking the hourly budget.
		burst = 500
	)

	limitPerSecond := rate.Limit(float64(limitPerHour) / float64(time.Hour/time.Second))

	return &GlobalRateLimiter{
		limiter:      rate.NewLimiter(limitPerSecond, burst),
		limitPerHour: limitPerHour,
	}
}

func (g *GlobalRateLimiter) RateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !g.limiter.Allow() {
			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", g.limitPerHour))
			w.Header().Set("X-RateLimit-Remaining", "0")
			w.Header().Set("Retry-After", "60")
			http.Error(w, "Global rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
			return
		}

		remaining := int(g.limiter.Tokens())
		if remaining < 0 {
			remaining = 0
		}

		w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", g.limitPerHour))
		w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))

		next.ServeHTTP(w, r)
	})
}

// Stop exists for symmetry with previous API; currently no resources to release.
func (g *GlobalRateLimiter) Stop() {}
