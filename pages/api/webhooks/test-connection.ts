import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Test connection endpoint hit:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
    });

    return res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
}
