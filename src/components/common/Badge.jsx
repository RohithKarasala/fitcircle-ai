import PropTypes from "prop-types";

function Badge({
  children,
  variant = "neutral",
  className = "",
}) {
  const classes = [
    "badge",
    `badge--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "neutral",
    "success",
    "warning",
    "danger",
    "accent",
  ]),
  className: PropTypes.string,
};

export default Badge;
