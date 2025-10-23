export function createPageUrl(page) {
  const routes = {
    Dashboard: '/dashboard',
    NewProject: '/new-project',
    ImageBank: '/image-bank',
    UserManagement: '/user-management',
    Settings: '/settings',
  };
  return routes[page] || '/';
}

export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
