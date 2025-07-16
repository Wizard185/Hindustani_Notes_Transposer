// api/delete-user.ts
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST allowed' }), { status: 405 });
  }

  try {
    const { userId } = await req.json();

const res = await fetch(`https://onrxwzgoqphpwqybsaim.supabase.co/auth/v1/admin/users/${userId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!
      }
    });

    if (!res.ok) {
      const error = await res.json();
      return new Response(JSON.stringify({ error: error.message }), { status: res.status });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to delete user' }), { status: 500 });
  }
}
