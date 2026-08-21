const FOLDER_NAME = 'Brush & Floss Data';
const FILE_NAME = 'data.json';

export async function initDriveSync(accessToken) {
  // 1. Find or create folder
  let folderId = await getFolderId(accessToken, FOLDER_NAME);
  if (!folderId) {
    folderId = await createFolder(accessToken, FOLDER_NAME);
  }

  // 2. Find or create file
  let fileId = await getFileId(accessToken, FILE_NAME, folderId);
  if (!fileId) {
    fileId = await createFile(accessToken, FILE_NAME, folderId, []);
  }

  return { folderId, fileId };
}

async function getFolderId(accessToken, folderName) {
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

async function createFolder(accessToken, folderName) {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });
  const data = await res.json();
  return data.id;
}

async function getFileId(accessToken, fileName, folderId) {
  const query = encodeURIComponent(`'${folderId}' in parents and name='${fileName}' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

async function createFile(accessToken, fileName, folderId, content) {
  const boundary = 'foo_bar_baz';
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json'
  };

  const body = `
--${boundary}
Content-Type: application/json; charset=UTF-8

${JSON.stringify(metadata)}
--${boundary}
Content-Type: application/json

${JSON.stringify(content)}
--${boundary}--
`;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: body.trim()
  });
  
  const data = await res.json();
  return data.id;
}

export async function readDriveFile(accessToken, fileId) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function writeDriveFile(accessToken, fileId, content) {
  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(content)
  });
  return res.ok;
}
