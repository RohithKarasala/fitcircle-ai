import { forwardRef, useId } from "react";
import PropTypes from "prop-types";

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    className = "",
    id,
    ...inputProps
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const descriptionId = error
    ? `${inputId}-error`
    : helperText
      ? `${inputId}-helper`
      : undefined;

  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <label
          className="form-field__label"
          htmlFor={inputId}
        >
          {label}
        </label>
      )}

      <input
        ref={ref}
        id={inputId}
        className={[
          "input",
          error ? "input--error" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        {...inputProps}
      />

      {error && (
        <p
          id={`${inputId}-error`}
          className="form-field__message form-field__message--error"
        >
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          id={`${inputId}-helper`}
          className="form-field__message"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string,
};

export default Input;
