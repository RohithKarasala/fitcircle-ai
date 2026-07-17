import PropTypes from "prop-types";
import { LoaderCircle } from "lucide-react";

const buttonVariants = {
  primary: "button--primary",
  secondary: "button--secondary",
  ghost: "button--ghost",
  danger: "button--danger",
};

const buttonSizes = {
  small: "button--small",
  medium: "button--medium",
  large: "button--large",
};

function Button({
  children,
  variant = "primary",
  size = "medium",
  type = "button",
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  ...buttonProps
}) {
  const classes = [
    "button",
    buttonVariants[variant],
    buttonSizes[size],
    fullWidth ? "button--full-width" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...buttonProps}
    >
      {loading && (
        <LoaderCircle
          className="button__spinner"
          size={18}
          aria-hidden="true"
        />
      )}

      <span>{children}</span>
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "ghost",
    "danger",
  ]),
  size: PropTypes.oneOf([
    "small",
    "medium",
    "large",
  ]),
  type: PropTypes.oneOf([
    "button",
    "submit",
    "reset",
  ]),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;
