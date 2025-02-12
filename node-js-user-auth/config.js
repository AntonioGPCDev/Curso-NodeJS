export const {
  PORT = 3000,
  SALT_ROUNDS = 10,
  SECRET_JWT_KEY = 'this-is-an-awesome-secret-key-con-hashes-muy-seguros' // en produccón debe de ser más aleatorio y seguro
} = process.env
