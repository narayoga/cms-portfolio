import type { Request, Response } from 'express';
import { sendOk, sendError } from '../lib/response';
import { getQueryText } from '../lib/values';
import { saveUploadedFile, UploadError, DEFAULT_UPLOAD_FOLDER } from '../lib/upload';

/**
 * POST /api/admin/upload?kind=image&folder=projects
 * Form field: "file"
 *
 *   kind   = image | file | any    (which file types are allowed, default "any")
 *   folder = projects | banners | catalog/items | ...   (see ALLOWED_UPLOAD_FOLDERS)
 *
 * Returns: { path: "/uploads/projects/park-hyatt-k3f9a2.jpg" }
 */
export async function uploadFile(request: Request, response: Response) {
  let kind = getQueryText(request, 'kind');
  if (kind === null) {
    kind = 'any';
  }

  let folder = getQueryText(request, 'folder');
  if (folder === null || folder === '') {
    folder = DEFAULT_UPLOAD_FOLDER;
  }

  try {
    const publicPath = await saveUploadedFile(request, response, kind, folder);
    sendOk(response, { path: publicPath });
  } catch (error) {
    if (error instanceof UploadError) {
      sendError(response, error.message, error.statusCode);
      return;
    }

    throw error;
  }
}
