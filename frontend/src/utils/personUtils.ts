export function calculateAge(birthDate: string, endDate?: string | null): number | null {
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;

  const end = endDate ? new Date(endDate) : new Date();
  if (isNaN(end.getTime())) return null;

  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

