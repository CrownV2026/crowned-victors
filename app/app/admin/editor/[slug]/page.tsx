import React from 'react'
import EditorClient from '../../../../components/EditorClient'

export default async function EditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <div>
      <EditorClient slug={slug} />
    </div>
  )
}
