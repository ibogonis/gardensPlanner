import Button from "./Button";

export default function LogoutButton({ onLogout }) {
  return <Button type="button" textButton="Logout" onClick={onLogout} />;
}
