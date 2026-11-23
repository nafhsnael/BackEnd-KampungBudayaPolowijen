import { put } from '@vercel/blob';
import { env } from '../config/env';
import { HttpError } from '../errors';

export async function uploadProfilePhoto(file: Express.Multer.File, userId: string): Promise<string> {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new HttpError(503, 'Penyimpanan foto belum dikonfigurasi');
  }

  const isPng = file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
  if (!isPng && !isJpeg) {
    throw new HttpError(422, 'Foto harus berupa gambar JPG atau PNG', {
      photo: ['Format file bukan JPG atau PNG'],
    });
  }

  const extension = isPng ? 'png' : 'jpg';
  try {
    const blob = await put(`mobile-profile/${userId}-${Date.now()}.${extension}`, file.buffer, {
      access: 'public',
      token: env.BLOB_READ_WRITE_TOKEN,
      contentType: isPng ? 'image/png' : 'image/jpeg',
    });
    return blob.url;
  } catch (error) {
    console.error('Mobile profile photo upload failed:', error);
    throw new HttpError(502, 'Foto profil gagal diunggah');
  }
}
