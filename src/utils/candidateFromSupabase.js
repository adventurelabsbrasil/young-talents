/**
 * Mapeia um candidato retornado pelo Supabase (snake_case) para o formato
 * usado pelo app (camelCase e campos esperados pelos componentes).
 */
export function mapCandidateFromSupabase(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    emailSecondary: row.email_secondary,
    phone: row.phone,
    birthDate: row.birth_date,
    age: row.age,
    maritalStatus: row.marital_status,
    childrenCount: row.children_count,
    hasLicense: row.has_license,
    city: row.city,
    photoUrl: row.photo_url,
    education: row.education,
    schoolingLevel: row.schooling_level,
    institution: row.institution,
    graduationDate: row.graduation_date,
    isStudying: row.is_studying,
    experience: row.experience,
    courses: row.courses,
    certifications: row.certifications,
    interestAreas: row.interest_areas,
    cvUrl: row.cv_url,
    portfolioUrl: row.portfolio_url,
    source: row.source,
    referral: row.referral,
    salaryExpectation: row.salary_expectation,
    canRelocate: row.can_relocate,
    professionalReferences: row.professional_references,
    typeOfApp: row.type_of_app,
    freeField: row.free_field,
    status: row.status ?? 'Inscrito',
    tags: row.tags ?? [],
    origin: row.origin,
    createdBy: row.created_by,
    original_timestamp: row.original_timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null
  };
}

/**
 * Mapeia uma lista de candidatos do Supabase para o formato do app.
 */
export function mapCandidatesFromSupabase(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapCandidateFromSupabase).filter(Boolean);
}
