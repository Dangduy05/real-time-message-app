const uploadController = require('../../backend/src/controllers/uploadController');
const errorMiddleware = require('../../backend/src/middlewares/errorMiddleware');

const createResponse = () => {
    const res = {
        status: jest.fn(),
        json: jest.fn()
    };

    res.status.mockReturnValue(res);

    return res;
};

describe('uploadController', () => {
    test('returns 400 when file is missing', async () => {
        const req = {};
        const res = createResponse();

        await uploadController.uploadFile(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'File is required'
        });
    });

    test('returns uploaded file url', async () => {
        const req = {
            file: {
                filename: '123-test.png'
            }
        };
        const res = createResponse();

        await uploadController.uploadFile(req, res);

        expect(res.json).toHaveBeenCalledWith({
            fileUrl: '/uploads/files/123-test.png'
        });
    });
});

describe('errorMiddleware', () => {
    test('returns 400 for unsupported upload type', () => {
        const err = new Error('Unsupported file type');
        const res = createResponse();

        errorMiddleware(err, {}, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Unsupported file type'
        });
    });
});
