import { useHistory } from "../state/history";

export function HistoryTable() {
  const history = useHistory();
  console.log("from table", history);
  return (
    <table>
      <caption>History</caption>
      <thead>
        <tr>
          <th>Year</th>
          <th>Name</th>
          <th>Image</th>
        </tr>
      </thead>
      <tbody>
        {history.map((plan, index) => (
          <tr key={index}>
            <td>{plan?.name}</td>
            <td>{plan?.year}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
