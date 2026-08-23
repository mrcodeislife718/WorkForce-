export function employeeProfile(employee = {}) {
  return {
    displayName: employee.name || 'ORCA Digital Employee',
    roleTitle: employee.role_title || employee.category || 'Digital Employee',
    department: employee.department || 'Business Operations',
    careerLevel: employee.career_level || 'Professional',
    experience: employee.equivalent_experience_years
      ? `${employee.equivalent_experience_years}+ years equivalent experience`
      : 'Experience benchmark pending',
    skills: Array.isArray(employee.skills) ? employee.skills : [],
    workModes: Array.isArray(employee.work_modes) ? employee.work_modes : [],
    avatarVariant: Number(employee.avatar_variant || 0),
  }
}

export function employeePricing(employee = {}) {
  return employee.pricing || {
    launch_rate_percent: 35,
    customer_savings_percent: 65,
    regular_salary_annual: Number(employee.regular_salary_annual || 0),
    regular_salary_monthly: 0,
    orca_monthly_price: Number(employee.base_price || 0),
    monthly_salary_savings: 0,
  }
}

export function currency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function avatarSource(employee = {}) {
  return [employee.profile_image_url, employee.hero_banner_url]
    .find((value) => typeof value === 'string' && /^(https?:\/\/|data:image\/|\/)/i.test(value)) || null
}

export function normalizeMode(mode) {
  return String(mode || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
