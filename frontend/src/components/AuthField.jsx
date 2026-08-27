import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const AuthField = ({
  id,
  label,
  error,
  hint,
  type = "text",
  className = "",
  ...inputProps
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={`tf-field ${className}`.trim()}>
      <label className="tf-field__label" htmlFor={id}>
        {label}
      </label>
      <div
        className={`tf-field__control ${isPassword ? "tf-field__control--password" : ""} ${
          error ? "tf-field__control--error" : ""
        }`.trim()}
      >
        <input
          {...inputProps}
          id={id}
          type={isPassword && passwordVisible ? "text" : type}
          className="tf-field__input"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        {isPassword && (
          <button
            className="tf-field__visibility"
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            disabled={inputProps.disabled}
            aria-label={passwordVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={passwordVisible}
            aria-controls={id}
          >
            {passwordVisible ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {hint && !error && (
        <p className="tf-field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="tf-field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default AuthField;
