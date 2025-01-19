import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Test endpoint hit:', {
        method: req.method,
        headers: req.headers,
        body: req.body
    });

    res.status(200).json({ message: 'Test endpoint working!' });
}
