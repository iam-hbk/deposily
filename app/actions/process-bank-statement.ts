'use server'

import { parseFile } from '@/lib/parsers/ai-parser';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function processBankStatement(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const organizationId = parseInt(formData.get('organizationId') as string);
    const processFile = formData.get('processFile') === 'true';

    if (!file || !fileName || !organizationId) {
      throw new Error('Missing required fields');
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Convert File to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Upload file to Supabase Storage
    const fileExt = `.${file.name.split('.').pop()}`;
    const storageFileName = `${fileName}-${Date.now()}${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('bank-statements')
      .upload(storageFileName, fileBuffer);

    if (uploadError) {
      throw new Error(`Error uploading file: ${uploadError.message}`);
    }

    // Get the public URL of the uploaded file
    const { } = supabase.storage
      .from('bank-statements')
      .getPublicUrl(storageFileName);

    // Create a record in the bank-statements table
    const { data: statementData, error: insertError } = await supabase
      .from('bank-statements')
      .insert({
        file_path: storageFileName,
        file_type: file.type,
        organization_id: organizationId,
        processed: processFile,
        uploaded_at: new Date().toISOString(),
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error inserting record: ${insertError.message}`);
    }

    // If processFile is true, start processing
    if (processFile) {
      const transactions = await parseFile(file);

      // Insert payments into database
      // Get the current user ID once before mapping
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: paymentsError } = await supabase
        .from('payments')
        .insert(
          transactions.transactions.map(transaction => ({
            amount: transaction.amount,
            date: transaction.date,
            description: transaction.reference,
            status: 'pending',
            bank_statement_id: statementData.file_id,
            organization_id: organizationId,
            created_at: new Date().toISOString(),
            created_by: user?.id
          }))
        );

      if (paymentsError) {
        throw new Error(`Error inserting payments: ${paymentsError.message}`);
      }
    }

    // Revalidate the page to show updated data
    revalidatePath('/dashboard/organizations/[id]');

    return { success: true, data: statementData };

  } catch (error) {
    console.error('Error processing request:', error);
    return {
      error: error instanceof Error ? error.message : 'An error occurred while processing the request'
    };
  }
} 