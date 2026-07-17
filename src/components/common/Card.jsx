import PropTypes from "prop-types";

function Card({
  children,
  className = "",
  padding = "medium",
  as: Component = "section",
  ...cardProps
}) {
  const classes = [
    "card",
    `card--padding-${padding}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...cardProps}>
      {children}
    </Component>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  as: PropTypes.elementType,
  padding: PropTypes.oneOf([
    "none",
    "small",
    "medium",
    "large",
  ]),
};

export default Card;
