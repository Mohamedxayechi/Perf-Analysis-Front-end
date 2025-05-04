export interface Project {
  id: string;
  projectName: string;
  description: string;
  timestamp: string;
  userId: string; // ID de l'utilisateur qui a créé le projet
  videoUrl: string;
  createdBy?: string; // Optionnel : Nom d'utilisateur pour l'affichage
}
export interface User {
  id: string;
  username: string;
  role: 'user' | 'admin'; 
}
