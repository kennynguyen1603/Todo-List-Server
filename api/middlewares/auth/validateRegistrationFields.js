// Validation function
function validateFields(fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (!value) throw new Error(`${key} is required!`);
  }
}

const validateRegistrationFields = (req, res, next) => {
  const { username, email, password, career } = req.body;
  try {
    validateFields({
      username,
      email,
      password,
      career,
    });
  } catch (validationError) {
    return res.status(400).send({ message: validationError.message });
  }
  next();
};

export { validateRegistrationFields };
