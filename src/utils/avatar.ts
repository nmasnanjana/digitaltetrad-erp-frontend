export function generateAvatarUrl(firstName: string, lastName?: string): string {
  // Get first letter of first name
  const firstInitial = firstName.charAt(0).toUpperCase();
  
  // Get first letter of last name if it exists
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  // Combine initials
  const initials = `${firstInitial}${lastInitial}`;
  
  // Generate a random background color
  const colors = [
    'FFB900', // Yellow
    'E74856', // Red
    '0078D4', // Blue
    '0099BC', // Cyan
    '7A7574', // Gray
    '767676', // Dark Gray
    'FF8C00', // Orange
    '881798', // Purple
    '107C10', // Green
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Return the avatar URL using a service like ui-avatars.com
  return `https://ui-avatars.com/api/?name=${initials}&background=${randomColor}&color=fff&size=128`;
} 