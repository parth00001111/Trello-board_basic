const colors = ["coral", "violet", "blue", "green", "amber"];

const getColor = (name = "") => {
  const hash = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const UserAvatar = ({ name = "Team member", size = "sm", className = "" }) => (
  <span
    className={`user-avatar user-avatar-${size} avatar-${getColor(name)} ${className}`.trim()}
    title={name}
    aria-label={name}
  >
    {getInitials(name)}
  </span>
);

export default UserAvatar;
