async function logAuditAction(
  userId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue
) {
  try {
    await db.promise().query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
      ]
    );
  } catch (err) {
    console.error("Lỗi ghi audit log:", err);
  }
}

// const express = require("express");
// const router = express.Router();
// const db = require("../database"); // Kết nối cơ sở dữ liệu

// // API để ghi log
// router.post("/audit-logs", async (req, res) => {
//   const { user_id, action, entity_type, entity_id, old_value, new_value } =
//     req.body;

//   try {
//     await db.query(
//       "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)",
//       [user_id, action, entity_type, entity_id, old_value, new_value]
//     );
//     res.status(201).send({ message: "Audit log created successfully" });
//   } catch (error) {
//     console.error("Error creating audit log:", error);
//     res.status(500).send({ message: "Error creating audit log" });
//   }
// });

// module.exports = router;
