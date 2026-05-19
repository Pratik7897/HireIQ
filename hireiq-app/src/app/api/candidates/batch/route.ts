import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  try {
    const { ids, status } = await req.json();
    if (!Array.isArray(ids) || !status) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('candidates')
      .update({ status })
      .in('id', ids)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log update events in parallel
    try {
      await Promise.all(ids.map(id => 
        supabase.from('hiring_events').insert({
          candidate_id: id,
          event_type: 'candidate_updated',
          event_data: { fields: ['status'], new_status: status },
        })
      ));
    } catch { /* non-critical */ }

    return NextResponse.json({ success: true, count: data?.length || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { error } = await supabase
      .from('candidates')
      .delete()
      .in('id', ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
