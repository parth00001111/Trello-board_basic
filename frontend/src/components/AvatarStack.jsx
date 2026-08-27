import UserAvatar from "./UserAvatar";

const AvatarStack = ({ members = [], limit = 4 }) => {
  const visibleMembers = members.slice(0, limit);
  const remaining = Math.max(0, members.length - limit);

  return (
    <div className="avatar-stack" aria-label={`${members.length} workspace members`}>
      {visibleMembers.map((member) => (
        <UserAvatar key={member._id || member.id || member.username} name={member.username} />
      ))}
      {remaining > 0 && (
        <span className="avatar-overflow" aria-label={`${remaining} more members`}>
          +{remaining}
        </span>
      )}
    </div>
  );
};

export default AvatarStack;
