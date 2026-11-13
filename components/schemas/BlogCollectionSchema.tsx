import React from 'react';
import { StructuredData } from './StructuredData';
import { buildBlogCollectionData, type BlogCollectionData } from './blog-collection-data';

export const BlogCollectionSchema: React.FC<BlogCollectionData> = (props) => (
  <StructuredData id="blog-collection" data={buildBlogCollectionData(props)} />
);
