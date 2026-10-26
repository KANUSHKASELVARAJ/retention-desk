/**
 * Rule-based intervention recommender. It is driven by the model's own per-student
 * risk factors (TreeSHAP impacts from XGBoost), so recommendations differ per student.
 * A rule fires only if the factor is among the student's top risk drivers AND its
 * `when` condition holds for the student's actual value.
 */
const R = (match, category, priority, title, description, when) => ({ match, category, priority, title, description, when });

const RULES = [
  R(/^tuition_fees_up_to_date$/, 'financial', 'high', 'Resolve overdue tuition fees',
    'Meet the student to review unpaid fees, offer an instalment plan and check emergency-aid eligibility.', (v) => v === 0),
  R(/^debtor$/, 'financial', 'high', 'Financial counselling for outstanding debt',
    'Refer to the bursar/financial-aid office to agree a repayment plan before it blocks enrolment.', (v) => v === 1),
  R(/^scholarship_holder$/, 'financial', 'medium', 'Scholarship / grant eligibility review',
    'Check the student against available scholarships, bursaries and work-study options.', (v) => v === 0),
  R(/curricular_units_(1st|2nd)_sem_(approved|grade)$/, 'academic', 'high', 'Structured tutoring and study plan',
    'Pair the student with a tutor for the units they are failing and agree a weekly study plan with check-ins.'),
  R(/curricular_units_(1st|2nd)_sem_(evaluations|without_evaluations)$/, 'engagement', 'medium', 'Assessment attendance check',
    'Review missed or skipped assessments with the student; agree catch-up sittings and reminders.'),
  R(/curricular_units_(1st|2nd)_sem_enrolled$/, 'administrative', 'medium', 'Course-load review with academic advisor',
    'Review whether the number of enrolled units is realistic; consider re-sequencing units.'),
  R(/curricular_units_(1st|2nd)_sem_credited$/, 'administrative', 'low', 'Credit-recognition advising',
    'Confirm credited units are recorded correctly and plan the remaining pathway.'),
  R(/^(admission_grade|previous_qualification_grade)$/, 'academic', 'medium', 'Foundation / bridging support',
    'Offer bridging workshops or peer mentoring covering core prerequisites for the course.'),
  R(/^age_at_enrollment$/, 'engagement', 'medium', 'Mature-student support',
    'Discuss flexible scheduling, work-study balance and peer groups for non-traditional students.'),
  R(/^displaced$/, 'counseling', 'medium', 'Relocation and housing support',
    'Check housing, transport and community integration; connect with student-services housing advice.'),
  R(/^(unemployment_rate|inflation_rate|gdp)$/, 'financial', 'low', 'Economic-hardship check-in',
    'Regional economic conditions are a risk driver; offer hardship-fund information proactively.'),
  R(/^(course|application_mode|application_order|previous_qualification)$/, 'counseling', 'medium', 'Course-fit and career counselling',
    'Discuss whether the course matches the student’s goals; explore transfer or elective options.'),
  R(/^(marital_status|mother_s_|father_s_|international|nacionality)/, 'counseling', 'low', 'Wellbeing and support-network conversation',
    'Hold a supportive conversation about personal circumstances and signpost counselling and community services.'),
];

const FALLBACK = {
  high: R(null, 'counseling', 'high', 'Urgent one-to-one advisor meeting',
    'Schedule a meeting within 7 days to review the full risk profile and agree an action plan.'),
  medium: R(null, 'engagement', 'medium', 'Add to monitored mentoring list',
    'Assign a mentor and re-check progress after the next assessment period.'),
};
const DUE_DAYS = { high: 7, medium: 14, low: 30 };

export function recommend({ riskLevel, riskFactors = [] }) {
  const out = [];
  const seen = new Set();
  const add = (rule, triggeredBy, value) => {
    if (seen.has(rule.title)) return;
    seen.add(rule.title);
    const due = new Date(Date.now() + DUE_DAYS[rule.priority] * 86400000);
    out.push({
      category: rule.category,
      priority: riskLevel === 'high' && rule.priority === 'medium' ? 'high' : rule.priority,
      title: rule.title,
      description: triggeredBy ? `${rule.description} (Triggered by: ${triggeredBy}${value !== undefined ? ` = ${value}` : ''}.)` : rule.description,
      triggeredBy: triggeredBy ? triggeredBy : undefined,
      dueDate: due,
    });
  };

  if (riskLevel !== 'low') add(FALLBACK[riskLevel]);
  for (const f of riskFactors) {
    const rule = RULES.find((r) => r.match.test(f.feature) && (!r.when || r.when(f.value)));
    if (rule) add(rule, f.label, f.value);
    if (out.length >= 6) break;
  }
  return out;
}
