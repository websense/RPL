import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '2 solid #333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    padding: '8 12',
    borderRadius: 15,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusApprove: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusReject: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  statusComment: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#102F82',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '2 solid #333',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
  },
  tableCellLabel: {
    width: '33.33%',
    fontWeight: 'bold',
    fontSize: 11,
    backgroundColor: '#f5f5f5',
    padding: 8,
    lineHeight: 1.5,
  },
  tableCellValue: {
    width: '66.67%',
    fontSize: 11,
    padding: 8,
    lineHeight: 1.5,
  },
  tableHeaderLabel: {
    width: '33.33%',
    fontWeight: 'bold',
    fontSize: 11,
    color: '#ffffff',
  },
  tableHeaderValue: {
    width: '66.67%',
    fontSize: 11,
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 10,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#555',
  },
  commentBox: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  commentType: {
    fontSize: 11,
    fontWeight: 'bold',
    padding: '3 6',
    borderRadius: 3,
  },
  commentAuthor: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  commentText: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 1.5,
  },
  commentDate: {
    fontSize: 10,
    color: '#666',
    marginTop: 3,
  },
  link: {
    color: '#0066cc',
    textDecoration: 'underline',
    fontSize: 11,
  },
  unitHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
});

// PDF Document Component
export const ApplicationPDF = ({ recordId, status, uwaUnits, comments, generalComments }) => {
  const getStatusStyle = (stat) => {
    if (stat === 'Approve') return styles.statusApprove;
    if (stat === 'Reject') return styles.statusReject;
    return styles.statusComment;
  };

  const getCommentTypeStyle = (type) => {
    if (type === 'Approved') return { backgroundColor: '#4f8e4a', color: '#fff' };
    if (type === 'Rejected') return { backgroundColor: '#a84942', color: '#fff' };
    return { backgroundColor: '#96833F', color: '#fff' };
  };

  const getCommentBoxStyle = (type) => {
    if (type === 'Approved') return { backgroundColor: '#d2f7ce' };
    if (type === 'Rejected') return { backgroundColor: '#f7cfce' };
    return { backgroundColor: '#F7E9B2' };
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Application #{recordId}</Text>
        </View>

        {/* Unit Comparison Tables - UWA unit first, then each equivalent unit separately */}
        {uwaUnits.map((uwa, idx) => {
          const incomingList = Array.isArray(uwa.incoming) ? uwa.incoming : [];
          
          return (
            <View key={idx} break={idx > 0}>
              {/* UWA Unit Section with Status */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.sectionTitle}>
                  UWA Unit: {uwa?.code || 'N/A'} {uwaUnits.length > 1 ? `(${idx + 1}/${uwaUnits.length})` : ''}
                </Text>
                <View style={[styles.statusBadge, getStatusStyle(status)]}>
                  <Text>{status || 'Pending'}</Text>
                </View>
              </View>

              {/* Equivalent Units Summary */}
              {incomingList.length > 0 && (
                <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
                  Equivalent units: {incomingList.map((inc, i) => 
                    `${inc?.university || 'N/A'}, ${inc?.code || 'N/A'}`
                  ).join(' & ')}
                </Text>
              )}
              
              {/* UWA Unit Table - 2 columns */}
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderLabel}>Field</Text>
                  <Text style={styles.tableHeaderValue}>{uwa?.university || 'UWA'}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Unit Code</Text>
                  <Text style={styles.tableCellValue}>{uwa?.code || '-'}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Unit Name</Text>
                  <Text style={styles.tableCellValue}>{uwa?.name || '-'}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Unit Level</Text>
                  <Text style={styles.tableCellValue}>{uwa?.level || '-'}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Learning Outcomes</Text>
                  <Text style={styles.tableCellValue}>{uwa?.outcomes || '-'}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Indicative Assessments</Text>
                  <Text style={styles.tableCellValue}>{uwa?.indicativeAssessments || '-'}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Credit Points</Text>
                  <Text style={styles.tableCellValue}>{uwa?.creditPoints || '-'}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Contact Hours</Text>
                  <Text style={styles.tableCellValue}>{uwa?.contactHours || '-'}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Link to Unit Outline</Text>
                  <Text style={styles.tableCellValue}>
                    {uwa?.outline || (uwa?.code ? `https://handbooks.uwa.edu.au/unitdetails?code=${uwa.code}` : '-')}
                  </Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableCellLabel}>Year Completed</Text>
                  <Text style={styles.tableCellValue}>{uwa?.year || '-'}</Text>
                </View>
              </View>

              {/* Equivalent Units Section */}
              {incomingList.length > 0 ? (
                <>
                  <Text style={styles.subsectionTitle}>
                    Equivalent Unit{incomingList.length > 1 ? 's' : ''} ({incomingList.length})
                  </Text>
                  
                  {incomingList.map((incUnit, incIdx) => (
                    <View key={incIdx} style={{ marginBottom: 15 }}>
                      {incomingList.length > 1 && (
                        <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5, marginTop: 5, color: '#333' }}>
                          Equivalent Unit {incIdx + 1} of {incomingList.length}
                        </Text>
                      )}
                      
                      {/* Equivalent Unit Table - 2 columns */}
                      <View style={styles.table}>
                        <View style={styles.tableHeader}>
                          <Text style={styles.tableHeaderLabel}>Field</Text>
                          <Text style={styles.tableHeaderValue}>{incUnit?.university || 'External'}</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={styles.tableCellLabel}>Unit Code</Text>
                          <Text style={styles.tableCellValue}>{incUnit?.code || '-'}</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={styles.tableCellLabel}>Unit Name</Text>
                          <Text style={styles.tableCellValue}>{incUnit?.name || '-'}</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={styles.tableCellLabel}>Unit Level</Text>
                          <Text style={styles.tableCellValue}>{incUnit?.level || '-'}</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={styles.tableCellLabel}>Learning Outcomes</Text>
                          <Text style={styles.tableCellValue}>{incUnit?.outcomes || '-'}</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={styles.tableCellLabel}>Indicative Assessments</Text>
                          <Text style={styles.tableCellValue}>{incUnit?.indicativeAssessments || '-'}</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={styles.tableCellLabel}>Credit Points</Text>
                          <Text style={styles.tableCellValue}>{incUnit?.creditPoints || '-'}</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={styles.tableCellLabel}>Contact Hours</Text>
                          <Text style={styles.tableCellValue}>{incUnit?.contactHours || '-'}</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={styles.tableCellLabel}>Link to Unit Outline</Text>
                          <Text style={styles.tableCellValue}>{incUnit?.outline || '-'}</Text>
                        </View>

                        <View style={styles.tableRow}>
                          <Text style={styles.tableCellLabel}>Year Completed</Text>
                          <Text style={styles.tableCellValue}>{incUnit?.year || '-'}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={{ fontSize: 11, color: '#666', marginTop: 5 }}>No equivalent units specified</Text>
              )}
            </View>
          );
        })}

        {/* Supporting Documents Section */}
        <View style={{ marginTop: 20, marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Supporting Documents</Text>
          {(() => {
            // Collect all supporting documents from all UWA units
            const allDocs = [];
            uwaUnits.forEach((uwa) => {
              // Supporting docs are stored at the UWA unit level
              if (uwa?.supportingDocs) {
                if (Array.isArray(uwa.supportingDocs)) {
                  uwa.supportingDocs.forEach(doc => {
                    // Handle both string and object formats
                    const docObj = typeof doc === 'string' ? { name: doc, url: doc } : doc;
                    const docName = docObj.name || docObj.url;
                    const docUrl = docObj.url || docObj.name;
                    
                    if (docName) {
                      // Check if we already have this document (by name)
                      const exists = allDocs.find(d => d.name === docName);
                      if (!exists) {
                        allDocs.push({ name: docName, url: docUrl });
                      }
                    }
                  });
                } else {
                  const docObj = typeof uwa.supportingDocs === 'string' 
                    ? { name: uwa.supportingDocs, url: uwa.supportingDocs }
                    : uwa.supportingDocs;
                  const docName = docObj.name || docObj.url;
                  const docUrl = docObj.url || docObj.name;
                  
                  if (docName) {
                    const exists = allDocs.find(d => d.name === docName);
                    if (!exists) {
                      allDocs.push({ name: docName, url: docUrl });
                    }
                  }
                }
              }
            });

            return allDocs.length > 0 ? (
              <View style={{ marginTop: 10 }}>
                {allDocs.map((doc, idx) => {
                  // Determine if URL is valid and how to format it
                  const isHttp = /^https?:\/\//i.test(doc.url);
                  const isAppPath = typeof doc.url === 'string' && doc.url.startsWith('/');
                  
                  // Construct full URL if it's an app path
                  const finalUrl = isHttp ? doc.url : (isAppPath ? `http://localhost:5001${doc.url}` : doc.url);
                  
                  return (
                    <View key={idx} style={{ flexDirection: 'row', marginBottom: 5, marginLeft: 10 }}>
                      <Text style={{ fontSize: 11 }}>• </Text>
                      {finalUrl ? (
                        <Link src={finalUrl} style={styles.link}>
                          {doc.name}
                        </Link>
                      ) : (
                        <Text style={{ fontSize: 11 }}>{doc.name}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ fontSize: 11, color: '#666', marginTop: 10 }}>
                No supporting documents provided
              </Text>
            );
          })()}
        </View>

        {/* Comments Section */}
        {(comments.length > 0 || generalComments.length > 0) && (
          <View>
            <Text style={styles.sectionTitle}>Comments</Text>
            {[...comments, ...generalComments].map((c, i) => (
              <View key={i} style={[styles.commentBox, getCommentBoxStyle(c.type)]} wrap={false}>
                <View style={styles.commentHeader}>
                  <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                    <View style={[styles.commentType, getCommentTypeStyle(c.type)]}>
                      <Text>{c.type === 'Comment' ? 'Request Further Information' : c.type}</Text>
                    </View>
                    <Text style={styles.commentAuthor}>{c.author}</Text>
                  </View>
                  <Text style={styles.commentDate}>{c.date}</Text>
                </View>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};
