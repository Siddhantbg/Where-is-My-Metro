package validators

// Severity represents the severity level of a validation issue
type Severity string

const (
	SeverityError   Severity = "error"
	SeverityWarning Severity = "warning"
)

// Issue represents a validation issue found
type Issue struct {
	Severity Severity `json:"severity"`
	Category string   `json:"category"`
	ID       string   `json:"id"`
	Message  string   `json:"message"`
}

// Result holds the results of a validation category
type Result struct {
	Category string  `json:"category"`
	Passed   int     `json:"passed"`
	Failed   int     `json:"failed"`
	Warnings int     `json:"warnings"`
	Issues   []Issue `json:"issues,omitempty"`
}

// NewResult creates a new validation result
func NewResult(category string) *Result {
	return &Result{
		Category: category,
		Issues:   make([]Issue, 0),
	}
}

// AddError adds an error issue
func (r *Result) AddError(id, message string) {
	r.Failed++
	r.Issues = append(r.Issues, Issue{
		Severity: SeverityError,
		Category: r.Category,
		ID:       id,
		Message:  message,
	})
}

// AddWarning adds a warning issue
func (r *Result) AddWarning(id, message string) {
	r.Warnings++
	r.Issues = append(r.Issues, Issue{
		Severity: SeverityWarning,
		Category: r.Category,
		ID:       id,
		Message:  message,
	})
}

// AddPass increments the passed count
func (r *Result) AddPass() {
	r.Passed++
}

// HasErrors returns true if there are any errors
func (r *Result) HasErrors() bool {
	return r.Failed > 0
}

// Total returns the total number of validations run
func (r *Result) Total() int {
	return r.Passed + r.Failed
}
