import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await client.connect();
      const database = client.db('markdown_editor');
      const collection = database.collection('files');

      const { files } = req.body;

      // Delete all existing files and insert new ones
      await collection.deleteMany({});
      await collection.insertMany(files);

      res.status(200).json({ message: 'Files saved successfully' });
    } catch (error) {
      console.error('Error saving files:', error);
      res.status(500).json({ message: 'Error saving files' });
    } finally {
      await client.close();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}