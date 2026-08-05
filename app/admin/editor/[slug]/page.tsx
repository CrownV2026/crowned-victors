import React from 'react'
import dynamic from 'next/dynamic'

const EditorClient = dynamic(() => import('../../../components/EditorClient'), { ssr: false })

export default function EditorPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  return (
    <div>
      <EditorClient slug={slug} />
    </div>
  )
}
