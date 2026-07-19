# Pay Slip Parsing Specification (Format: Malam Pay / SQ Link)

## 1. Extract Target: Net Salary (Liquid Cash Inflow)
*   **Anchor String:** `סכום בבנק בש"ח` or `סכום בבנק`
*   **Target Value:** 11,787.33
*   **Parsing Logic:** Locate the anchor string, skip whitespace/delimiters, and capture the decimal number following it.
*   **Recommended Regex:**
    `סכום בבנק בש"ח\s*([\d,]+\.\d{2})`

---

## 2. Extract Target: Advanced Training Fund (Keren Hishtalmut)

### A. Employee Contribution (Deduction)
*   **Anchor String / Symbol ID:** `ניכוי קה"ש מנ` or Symbol `479`
*   **Target Value:** 325.00
*   **Parsing Logic:** Match the line containing symbol `479`. Extract the numeric value representing the employee's structural salary deduction.
*   **Recommended Regex:**
    `479\s+ניכוי קה"ש מנ\s+[\d\.]+\s+([\d,]+\.\d{2})`

### B. Employer Contribution (Asset Growth)
*   **Anchor String / Symbol ID:** `הפרשה קה"ש מ` or Symbol `38192`
*   **Target Value:** 975.00
*   **Parsing Logic:** Match the line containing symbol `38192`. Extract the terminal numeric value representing the employer's direct allocation.
*   **Recommended Regex:**
    `38192\s+הפרשה קה"ש מ\s+[\d\.]+\s+([\d,]+\.\d{2})`

---

## 3. Extract Target: Pension Fund

### A. Employee Contribution (Deduction)
*   **Anchor String / Symbol ID:** `הראל פנסיה` or Symbol `452`
*   **Target Value:** 780.00
*   **Parsing Logic:** Match the line containing symbol `452`. Extract the deduction amount taken from the gross baseline.
*   **Recommended Regex:**
    `452\s+הראל פנסיה\s+[\d\.]+\s+([\d,]+\.\d{2})`

### B. Employer Pension Rewards (Employer Benefit)
*   **Anchor String / Symbol ID:** `הפרשה הראל פו` or Symbol `35252`
*   **Target Value:** 845.00
*   **Parsing Logic:** Match the line containing symbol `35252`. Extract the specific employer contribution amount.
*   **Recommended Regex:**
    `35252\s+הפרשה הראל פו\s+[\d\.]+\s+([\d,]+\.\d{2})`

### C. Employer Severance Allocation (Pitzuim Asset)
*   **Anchor String / Symbol ID:** `הפרשה פיצים` or Symbol `35253`
*   **Target Value:** 1,082.90
*   **Parsing Logic:** Match the line containing symbol `35253`. Extract the severance/pitzuim asset allocation value.
*   **Recommended Regex:**
    `35253\s+הפרשה פיצים\s+[\d\.]+\s+([\d,]+\.\d{2})`

---

## Developer Implementation Notes
1. **Sanitization:** Strip or normalize Hebrew directional characters (RTL/LTR markers) from the raw extracted text before applying regex matching.
2. **Numeric Cast:** Strip commas (`,`) from string numbers before converting them to floats/decimals.
