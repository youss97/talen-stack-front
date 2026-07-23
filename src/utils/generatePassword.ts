/** Génère un mot de passe aléatoire robuste (majuscule, minuscule, chiffre, caractère spécial). */
export function generatePassword(length = 12): string {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const special = "!@#$%*?-_";
  const all = lower + upper + digits + special;

  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  const required = [pick(lower), pick(upper), pick(digits), pick(special)];
  const rest = Array.from({ length: Math.max(0, length - required.length) }, () => pick(all));

  const password = [...required, ...rest];
  // Mélange (Fisher-Yates) pour ne pas avoir les catégories toujours dans le même ordre
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }
  return password.join("");
}
