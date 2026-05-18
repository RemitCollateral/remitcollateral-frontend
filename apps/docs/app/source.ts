import { createSource } from 'fumadocs-mdx';
import { loader } from 'fumadocs-core/source';
import { docs } from '@/.source';

export const { getPage, getPages, pageTree } = loader({
  baseUrl: '/docs',
  source: docs.toSource(),
});
