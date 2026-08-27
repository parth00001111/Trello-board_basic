import { AlertCircle, CheckCircle2 } from "lucide-react";

const InlineNotice = ({ message, tone = "error" }) => {
  if (!message) return null;
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <p
      className={tone === "success" ? "form-success" : "form-error"}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
};

export default InlineNotice;
