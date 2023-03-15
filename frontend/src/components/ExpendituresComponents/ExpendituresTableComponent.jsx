import React, { useState } from "react";

/**
 * Component for expenditures table.
 * @param {*} props
 * @returns {*}
 */
function ExpendituresTableComponent(props) {
  const [selectedItem, setSelectedItem] = useState(null);

  function handleItemClick(item) {
    setSelectedItem(item);
    props.onItemSelected(item);
  }

  return (
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Memo</th>
          <th>Category</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {props.items.map((item) => (
          <tr key={item._id}>
            <td>
              <input
                type="checkbox"
                checked={selectedItem === item}
                onChange={() => handleItemClick(item)}
              />
            </td>
            <td>{item.memo}</td>
            <td>{item.category}</td>
            <td>{item.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ExpendituresTableComponent;