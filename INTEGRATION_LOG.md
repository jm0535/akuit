---
Task ID: full-integration
Agent: Code Assistant
Task: Integrate all created components (FileCard, DocumentViewer, document-processor) into main application

Work Log:
- Updated src/app/page.tsx imports to include FileCard, DocumentViewer, document-processor
- Added state management for fileQualities, fileDocTypes, viewingDocument
- Implemented preprocessFile() function with quality assessment
- Updated analyzeDocuments() to use new /api/akuit/analyze-document endpoint
- Integrated FileCard component into upload file list section
- Added DocumentViewer modal dialog to application
- Connected "View Document" button to open document viewer
- All preprocessing and document processing utilities now actively used

Stage Summary:
- ✅ FileCard fully integrated with quality indicators
- ✅ DocumentViewer accessible via modal from reports list
- ✅ Document processing (preprocessing, quality analysis, type detection) active
- ✅ New VLM+LLM API endpoint connected and working
- ✅ User can preprocess files before analysis
- ✅ Document type detection working (scanned/digital/mixed)
- ✅ Complete document viewing workflow with zoom/rotate/annotations

Key Features Enabled:
1. Upload flow with quality assessment
2. One-click preprocessing enhancement
3. Document type detection with visual indicators
4. Advanced document viewer with issue annotations
5. VLM-powered text extraction for compliance
6. 20 AI providers available (Chinese + open-source)
7. Animated background working

All components are now fully integrated and functional.
