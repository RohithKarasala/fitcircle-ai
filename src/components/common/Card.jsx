import PropTypes from "prop-types";

function Card({
  children,
  className = "",
  padding = "medium",
}) {
  const classes = [
    "card",
    `card--padding-${padding}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <section className={classes}>{children}</section>;
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  padding: PropTypes.oneOf([
    "none",
    "small",
    "medium",
    "large",
  ]),
};

export default Card;
