import styles from "./AuthForm.module.css";
import { useState } from "react";
import Button from "./Button";

export default function AuthForm({ title, message, fields, onSubmit }) {
  const initialState = fields.reduce((acc, field) => {
    acc[field.name] = "";
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialState);

  async function submitHandler(e) {
    e.preventDefault();
    onSubmit(formData);
  }

  const handleChange = ({ target }) => {
    setFormData((prev) => ({
      ...prev,
      [target.name]: target.value,
    }));
  };

  return (
    <form onSubmit={submitHandler} className={styles.authForm}>
      <h2>{title}</h2>
      <p>{message}</p>
      <hr></hr>

      {fields.map((field) => (
        <div key={field.name} className={styles.formGroup}>
          <div className={styles.inputGroup}>
            <span className={styles.inputGroupAddon}>
              <i className={`${field.icon} ${styles.icon}`}></i>
            </span>
            <input
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name]}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      ))}

      <div>
        <Button textButton="Submit" />
      </div>
    </form>
  );
}
