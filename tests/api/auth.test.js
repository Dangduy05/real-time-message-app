jest.mock('../../backend/src/models/User', () => ({
    findOne: jest.fn(),
    create: jest.fn()
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn()
}));

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../backend/src/models/User');
const authController = require('../../backend/src/controllers/authController');

const createResponse = () => {
    const res = {
        status: jest.fn(),
        json: jest.fn()
    };

    res.status.mockReturnValue(res);

    return res;
};

describe('authController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('register', () => {
        test('returns 400 when required fields are missing', async () => {
            const req = {
                body: {
                    email: 'user@example.com',
                    password: 'secret123'
                }
            };
            const res = createResponse();

            await authController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'fullName, email and password are required'
            });
            expect(User.create).not.toHaveBeenCalled();
        });

        test('returns 400 for invalid email', async () => {
            const req = {
                body: {
                    fullName: 'Test User',
                    email: 'not-an-email',
                    password: 'secret123'
                }
            };
            const res = createResponse();

            await authController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid email'
            });
            expect(User.findOne).not.toHaveBeenCalled();
        });

        test('returns 400 when email already exists', async () => {
            User.findOne.mockResolvedValue({
                _id: 'existing-user'
            });

            const req = {
                body: {
                    fullName: 'Test User',
                    email: 'user@example.com',
                    password: 'secret123'
                }
            };
            const res = createResponse();

            await authController.register(req, res);

            expect(User.findOne).toHaveBeenCalledWith({
                email: 'user@example.com'
            });
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Email already exists'
            });
        });

        test('creates user and omits password from response', async () => {
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed-password');
            jwt.sign.mockReturnValue('jwt-token');
            User.create.mockResolvedValue({
                _id: 'user-1',
                toObject: () => ({
                    _id: 'user-1',
                    fullName: 'Test User',
                    email: 'user@example.com',
                    password: 'hashed-password'
                })
            });

            const req = {
                body: {
                    fullName: 'Test User',
                    email: 'user@example.com',
                    password: 'secret123'
                }
            };
            const res = createResponse();

            await authController.register(req, res);

            expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
            expect(User.create).toHaveBeenCalledWith({
                fullName: 'Test User',
                email: 'user@example.com',
                password: 'hashed-password'
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                token: 'jwt-token',
                user: {
                    _id: 'user-1',
                    fullName: 'Test User',
                    email: 'user@example.com'
                }
            });
        });
    });

    describe('login', () => {
        test('returns 400 when credentials are missing', async () => {
            const req = {
                body: {
                    email: 'user@example.com'
                }
            };
            const res = createResponse();

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'email and password are required'
            });
            expect(User.findOne).not.toHaveBeenCalled();
        });

        test('returns 404 when user does not exist', async () => {
            User.findOne.mockResolvedValue(null);

            const req = {
                body: {
                    email: 'missing@example.com',
                    password: 'secret123'
                }
            };
            const res = createResponse();

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User not found'
            });
        });

        test('returns 401 for invalid password', async () => {
            User.findOne.mockResolvedValue({
                password: 'hashed-password'
            });
            bcrypt.compare.mockResolvedValue(false);

            const req = {
                body: {
                    email: 'user@example.com',
                    password: 'wrong-password'
                }
            };
            const res = createResponse();

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid credentials'
            });
        });

        test('returns token and safe user on success', async () => {
            User.findOne.mockResolvedValue({
                _id: 'user-1',
                password: 'hashed-password',
                toObject: () => ({
                    _id: 'user-1',
                    fullName: 'Test User',
                    email: 'user@example.com',
                    password: 'hashed-password'
                })
            });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('jwt-token');

            const req = {
                body: {
                    email: 'user@example.com',
                    password: 'secret123'
                }
            };
            const res = createResponse();

            await authController.login(req, res);

            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id: 'user-1'
                },
                'test-secret',
                {
                    expiresIn: '1d'
                }
            );
            expect(res.json).toHaveBeenCalledWith({
                token: 'jwt-token',
                user: {
                    _id: 'user-1',
                    fullName: 'Test User',
                    email: 'user@example.com'
                }
            });
        });
    });
});
