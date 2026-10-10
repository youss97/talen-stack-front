/** Taille maximale d'un CV déposé dans le vivier de talents. */
export const MAX_CV_FILE_SIZE = 2 * 1024 * 1024;

export const isCvTooLarge = (file: File) => file.size > MAX_CV_FILE_SIZE;
