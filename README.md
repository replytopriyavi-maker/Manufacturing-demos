# Data Pipeline Engineering Platform

## Project Overview

A comprehensive **Data Engineering Portfolio Project** demonstrating expertise in data pipeline development, ETL processes, data quality management, and analytics. This platform showcases skills essential for data engineering roles in manufacturing and supply chain industries.

### 🎯 Purpose

This project serves as a demonstration of:
- Data pipeline engineering and orchestration
- ETL/ELT processes with transformations
- Data quality validation and monitoring
- PySpark-style data processing
- SQL analytics and querying
- Manufacturing plant data management
- Real-time monitoring and logging

## 🛠 Technology Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **MongoDB**: NoSQL database for pipeline metadata and processed data
- **Pandas**: Data manipulation and transformation
- **Python 3.11**: Core programming language

### Frontend
- **React 19**: Modern UI framework
- **Recharts**: Data visualization
- **Monaco Editor**: SQL query interface
- **Tailwind CSS**: Utility-first styling
- **Sonner**: Toast notifications

### Design
- **Control Room Aesthetic**: Professional, technical dark theme
- **Fonts**: Manrope (UI) + JetBrains Mono (data/code)
- **Color Palette**: Blue/Teal accent colors for technical feel

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.js         # Overview & metrics
│   │   │   ├── Pipelines.js         # Pipeline management
│   │   │   ├── PipelineDetail.js   # Execution logs & details
│   │   │   ├── DataQuality.js      # Quality rules & monitoring
│   │   │   ├── Analytics.js        # SQL query interface
│   │   │   └── DataSources.js      # Data source management
│   │   └── App.css           # Global styles
│   ├── package.json          # Node dependencies
│   └── .env                  # Frontend environment
└── README.md                 # This file
```

## 🚀 Features

### 1. Pipeline Management
- **Create & Configure Pipelines**: Define ETL pipelines with custom transformations
- **Execute Pipelines**: Run pipelines on-demand or via schedule
- **Monitor Execution**: Real-time status tracking and logging
- **Transformation Support**:
  - Filter operations
  - Aggregations (sum, avg, count)
  - Null removal
  - Deduplication

### 2. Data Quality Framework
- **Validation Rules**: Define quality checks
  - Completeness (null/missing value checks)
  - Accuracy (range validation)
  - Consistency (pattern matching)
  - Timeliness
- **Quality Scoring**: Automatic quality score calculation
- **Severity Levels**: Critical, High, Medium, Low
- **Trend Analysis**: Visual quality score trends

### 3. Data Processing Engine
- **PySpark-Style Operations**: Demonstrates understanding of distributed data processing
- **Data Generation**: Simulates manufacturing plant data
- **Transformation Pipeline**:
  ```
  Raw Data → Validation → Transformation → Quality Check → Storage
  ```

### 4. SQL Analytics
- **Query Interface**: Monaco editor for SQL queries
- **Sample Queries**: Pre-built queries for common operations
- **Data Export**: CSV export functionality
- **Visual Results**: Formatted table display

### 5. Monitoring Dashboard
- **Real-Time Metrics**:
  - Active pipelines count
  - Success/failure rates
  - Average quality scores
  - System health
- **Quality Trend Charts**: Visualize data quality over time
- **Recent Runs Table**: Latest pipeline execution history

## 🔧 Key Technical Implementations

### Backend Highlights

#### 1. ETL Engine (`server.py`)
```python
def apply_transformations(data: List[Dict], transformations: List[Dict]):
    """PySpark-style data transformations"""
    - Filter operations
    - Aggregations
    - Null removal
    - Deduplication
```

#### 2. Data Quality Validation
```python
def validate_data(data: List[Dict], rules: List[Dict]):
    """Comprehensive data quality checks"""
    - Completeness checks
    - Accuracy range validation
    - Consistency pattern matching
    - Quality score calculation
```

#### 3. Data Generation
```python
def generate_plant_data(num_records: int):
    """Generate realistic manufacturing data"""
    - Production volumes
    - Quality scores
    - Temperature readings
    - pH levels
    - Batch tracking
```

### Frontend Highlights

#### 1. Interactive Dashboard
- Real-time metrics display
- Quality trend visualization (Recharts)
- Responsive design
- Data-driven components

#### 2. SQL Query Interface
- Monaco editor integration
- Syntax highlighting
- Sample query templates
- Result export functionality

#### 3. Pipeline Execution Logs
- Real-time log streaming
- Color-coded log levels
- Execution metrics
- Error handling

## 📊 Sample Data

The platform generates realistic manufacturing plant data including:

### Data Points
- **Plant Locations**: Atlanta, NYC, Chicago, LA, Miami
- **Products**: Product A, B, C, D, E (generic beverage products)
- **Metrics**:
  - Production volume (5,000-15,000 units)
  - Quality scores (85-100%)
  - Downtime (0-120 minutes)
  - Temperature (2-8°C)
  - pH levels (2.8-3.5)
  - Batch IDs
  - Operator IDs

### Data Quality Issues (Simulated)
- 5% missing values (to test completeness checks)
- 3% out-of-range values (to test accuracy validation)

## 🎓 Skills Demonstrated

### For Data Engineering Roles:

✅ **Data Pipeline Development**
- Built complete ETL pipeline system
- Implemented data ingestion, transformation, and loading

✅ **PySpark & Distributed Processing**
- PySpark-style transformations (filter, aggregate, deduplicate)
- Pandas for data manipulation

✅ **SQL Proficiency**
- SQL query interface
- Data aggregation and analysis

✅ **Python Development**
- FastAPI backend implementation
- Async/await patterns
- Type hints with Pydantic

✅ **Data Quality & Validation**
- Comprehensive validation framework
- Quality scoring system
- Monitoring and alerting

✅ **Data Modeling**
- MongoDB schema design
- Relationship management
- Metadata tracking

✅ **Performance Optimization**
- Efficient data processing
- Query optimization
- Async operations

✅ **Documentation**
- Code documentation
- API documentation
- System architecture

## 🚦 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB

### Installation

1. **Clone and Navigate**
```bash
cd /app
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
yarn install
```

4. **Start Services**
```bash
# Backend (runs on port 8001)
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend (runs on port 3000)
yarn start
```

5. **Initialize Sample Data**
The application automatically initializes sample data on first load.

## 📈 API Endpoints

### Pipelines
- `GET /api/pipelines` - List all pipelines
- `POST /api/pipelines` - Create new pipeline
- `GET /api/pipelines/{id}` - Get pipeline details
- `PUT /api/pipelines/{id}` - Update pipeline
- `DELETE /api/pipelines/{id}` - Delete pipeline
- `POST /api/pipelines/{id}/execute` - Execute pipeline

### Data Quality
- `GET /api/quality-rules` - List quality rules
- `POST /api/quality-rules` - Create quality rule
- `PUT /api/quality-rules/{id}` - Update rule
- `GET /api/quality-results` - Get validation results

### Data Sources
- `GET /api/data-sources` - List data sources
- `POST /api/data-sources` - Create data source

### Analytics
- `POST /api/analytics/query` - Execute SQL query
- `GET /api/dashboard/stats` - Get dashboard statistics

### Pipeline Runs
- `GET /api/pipeline-runs` - List pipeline executions
- `GET /api/pipeline-runs/{id}` - Get execution details

## 🔐 Environment Variables

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=<your-backend-url>
```

## 🎨 Design Philosophy

The platform follows a **"Control Room"** aesthetic:
- **Dark Mode**: Reduces eye strain for data-intensive work
- **Monospace Fonts**: Clear data and code display
- **Dense Information**: Efficient use of space
- **Professional Colors**: Blue/Teal for technical credibility
- **Sharp Edges**: Industrial, precise feel

## 📝 Code Quality

- **Type Safety**: Pydantic models for data validation
- **Error Handling**: Comprehensive try-catch blocks
- **Logging**: Structured logging for debugging
- **MongoDB Best Practices**: Proper ObjectId handling
- **Async Operations**: Non-blocking I/O operations

## 🧪 Testing the Platform

### 1. Execute a Pipeline
```bash
# Get backend URL
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

# Get first pipeline ID
PIPELINE_ID=$(curl -s "$API_URL/api/pipelines" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data[0]['id'])")

# Execute pipeline
curl -X POST "$API_URL/api/pipelines/$PIPELINE_ID/execute"
```

### 2. Query Data
Use the SQL Analytics interface to query processed data:
```sql
-- View all production data
SELECT * FROM processed_data LIMIT 100;

-- Aggregate by plant
GROUP BY plant_id, SUM(production_volume)

-- Average quality by product
GROUP BY product, AVG(quality_score)
```

## 🎯 Project Achievements

This project demonstrates:
1. **End-to-End Data Pipeline**: From ingestion to visualization
2. **Production-Ready Code**: Error handling, logging, type safety
3. **Modern Tech Stack**: Latest versions of FastAPI, React, MongoDB
4. **Professional UI/UX**: Control room aesthetic, intuitive design
5. **Comprehensive Features**: All aspects of data engineering workflow
6. **Portfolio Quality**: Clean code, documentation, architecture

## 🚀 Future Enhancements

Potential additions to showcase more skills:
- Real-time streaming data ingestion
- Advanced data lineage tracking
- Machine learning integration for anomaly detection
- Kubernetes deployment configuration
- CI/CD pipeline setup
- Advanced security features (OAuth, RBAC)

## 📧 Use Cases

This platform is ideal for demonstrating data engineering capabilities for:
- Manufacturing and production environments
- Supply chain data management
- Quality control and monitoring systems
- IoT sensor data processing
- Real-time operational analytics

**Key Technologies**: Python | FastAPI | React | MongoDB | Pandas | Data Pipelines | ETL | Data Quality

---

**Built for Data Engineering Portfolio**
