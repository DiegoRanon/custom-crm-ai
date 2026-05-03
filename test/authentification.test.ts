import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

const mockPrismaUser = {
  findUnique: vi.fn(),
  create: vi.fn(),
};

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => ({ user: mockPrismaUser })),
}));

async function authorize(
  credentials: {
    email?: string;
    password?: string;
  } | null,
) {
  if (!credentials?.email || !credentials?.password) return null;

  const user = await mockPrismaUser.findUnique({
    where: { email: credentials.email },
  });
  if (!user) return null;

  const valid = await bcrypt.compare(credentials.password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, name: user.name, email: user.email };
}

async function register(body: {
  name?: string;
  email?: string;
  password?: string;
}) {
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return { status: 400, message: "Name, email, and password are required." };
  }

  const existing = await mockPrismaUser.findUnique({ where: { email } });
  if (existing) {
    return { status: 409, message: "A user with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await mockPrismaUser.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return { status: 201, message: "User created successfully.", user };
}

describe("authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("password hashing", () => {
    it("should hash a password and verify it", async () => {
      const password = "SecureP@ss123";
      const hash = await bcrypt.hash(password, 10);

      expect(hash).not.toBe(password);
      expect(await bcrypt.compare(password, hash)).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const hash = await bcrypt.hash("correct-password", 10);

      expect(await bcrypt.compare("wrong-password", hash)).toBe(false);
    });
  });

  describe("authorize (credentials login)", () => {
    it("should return null when credentials are missing", async () => {
      expect(await authorize(null)).toBeNull();
      expect(await authorize({ email: "a@b.com" })).toBeNull();
      expect(await authorize({ password: "123" })).toBeNull();
    });

    it("should return null when user is not found", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await authorize({
        email: "unknown@test.com",
        password: "pass",
      });

      expect(result).toBeNull();
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: "unknown@test.com" },
      });
    });

    it("should return null when password is wrong", async () => {
      const hash = await bcrypt.hash("real-password", 10);
      mockPrismaUser.findUnique.mockResolvedValue({
        id: "1",
        name: "Alice",
        email: "alice@test.com",
        passwordHash: hash,
      });

      const result = await authorize({
        email: "alice@test.com",
        password: "wrong-password",
      });

      expect(result).toBeNull();
    });

    it("should return user data when credentials are valid", async () => {
      const hash = await bcrypt.hash("correct-password", 10);
      mockPrismaUser.findUnique.mockResolvedValue({
        id: "1",
        name: "Alice",
        email: "alice@test.com",
        passwordHash: hash,
      });

      const result = await authorize({
        email: "alice@test.com",
        password: "correct-password",
      });

      expect(result).toEqual({
        id: "1",
        name: "Alice",
        email: "alice@test.com",
      });
    });
  });

  describe("register", () => {
    it("should reject when required fields are missing", async () => {
      expect(await register({})).toMatchObject({ status: 400 });
      expect(await register({ name: "A" })).toMatchObject({ status: 400 });
      expect(await register({ name: "A", email: "a@b.com" })).toMatchObject({
        status: 400,
      });
    });

    it("should reject when email already exists", async () => {
      mockPrismaUser.findUnique.mockResolvedValue({ id: "existing" });

      const result = await register({
        name: "Bob",
        email: "bob@test.com",
        password: "pass123",
      });

      expect(result).toMatchObject({ status: 409 });
    });

    it("should create a user with a hashed password", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);
      mockPrismaUser.create.mockResolvedValue({
        id: "2",
        name: "Carol",
        email: "carol@test.com",
        createdAt: new Date(),
      });

      const result = await register({
        name: "Carol",
        email: "carol@test.com",
        password: "mypassword",
      });

      expect(result).toMatchObject({ status: 201 });
      expect(mockPrismaUser.create).toHaveBeenCalledOnce();

      const createCall = mockPrismaUser.create.mock.calls[0][0];
      expect(createCall.data.email).toBe("carol@test.com");
      expect(createCall.data.passwordHash).not.toBe("mypassword");
      expect(
        await bcrypt.compare("mypassword", createCall.data.passwordHash),
      ).toBe(true);
    });
  });
});
