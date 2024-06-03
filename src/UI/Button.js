export default function Button(props) {
  return (
    <button>
      {props.textButton}
      <svg
        width="52"
        height="8"
        viewBox="0 0 52 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M51.3536 4.35355C51.5488 4.15829 51.5488 3.84171 51.3536 3.64645L48.1716 0.464466C47.9763 0.269204 47.6597 0.269204 47.4645 0.464466C47.2692 0.659728 47.2692 0.976311 47.4645 1.17157L50.2929 4L47.4645 6.82843C47.2692 7.02369 47.2692 7.34027 47.4645 7.53553C47.6597 7.7308 47.9763 7.7308 48.1716 7.53553L51.3536 4.35355ZM2.26642e-10 4.5L51 4.5L51 3.5L-2.26642e-10 3.5L2.26642e-10 4.5Z"
          fill="black"
        />
      </svg>
    </button>
  );
}