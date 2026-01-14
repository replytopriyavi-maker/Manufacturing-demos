from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import random
import pandas as pd
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class DataSource(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # "manufacturing_plant", "quality_sensor", "inventory_system"
    location: str
    status: str = "active"  # "active", "inactive"
    config: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DataSourceCreate(BaseModel):
    name: str
    type: str
    location: str
    config: Dict[str, Any] = {}

class Pipeline(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    source_id: str
    transformations: List[Dict[str, Any]] = []
    schedule: Optional[str] = None
    status: str = "draft"  # "draft", "active", "paused"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PipelineCreate(BaseModel):
    name: str
    description: str
    source_id: str
    transformations: List[Dict[str, Any]] = []
    schedule: Optional[str] = None

class PipelineRun(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pipeline_id: str
    pipeline_name: str
    status: str  # "running", "success", "failed"
    start_time: datetime
    end_time: Optional[datetime] = None
    records_processed: int = 0
    records_failed: int = 0
    logs: List[Dict[str, Any]] = []
    metrics: Dict[str, Any] = {}
    error_message: Optional[str] = None

class DataQualityRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    rule_type: str  # "completeness", "accuracy", "consistency", "timeliness"
    field: str
    condition: Dict[str, Any]
    severity: str  # "critical", "high", "medium", "low"
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DataQualityRuleCreate(BaseModel):
    name: str
    description: str
    rule_type: str
    field: str
    condition: Dict[str, Any]
    severity: str

class DataQualityResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pipeline_run_id: str
    rule_id: str
    rule_name: str
    passed: bool
    records_checked: int
    records_failed: int
    quality_score: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProcessedData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pipeline_run_id: str
    data: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== DATA GENERATION ====================

def generate_plant_data(num_records: int = 100) -> List[Dict[str, Any]]:
    """Generate simulated manufacturing plant data"""
    plants = ["Plant_ATL", "Plant_NYC", "Plant_CHI", "Plant_LA", "Plant_MIA"]
    products = ["Product_A", "Product_B", "Product_C", "Product_D", "Product_E"]
    
    data = []
    base_time = datetime.now(timezone.utc) - timedelta(days=7)
    
    for i in range(num_records):
        record = {
            "record_id": f"REC_{i:06d}",
            "plant_id": random.choice(plants),
            "product": random.choice(products),
            "production_volume": round(random.uniform(5000, 15000), 2),
            "quality_score": round(random.uniform(85, 100), 2),
            "downtime_minutes": random.randint(0, 120),
            "batch_id": f"BATCH_{random.randint(1000, 9999)}",
            "temperature": round(random.uniform(2, 8), 1),
            "ph_level": round(random.uniform(2.8, 3.5), 2),
            "timestamp": (base_time + timedelta(hours=i)).isoformat(),
            "operator_id": f"OP_{random.randint(100, 999)}"
        }
        # Randomly add some data quality issues
        if random.random() < 0.05:  # 5% missing values
            record["quality_score"] = None
        if random.random() < 0.03:  # 3% out of range
            record["temperature"] = round(random.uniform(15, 25), 1)
        
        data.append(record)
    
    return data

def apply_transformations(data: List[Dict[str, Any]], transformations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Apply PySpark-style transformations to data"""
    df = pd.DataFrame(data)
    
    for transform in transformations:
        transform_type = transform.get("type")
        
        if transform_type == "filter":
            condition = transform.get("condition")
            if condition:
                field = condition.get("field")
                operator = condition.get("operator")
                value = condition.get("value")
                
                if operator == ">": df = df[df[field] > value]
                elif operator == "<": df = df[df[field] < value]
                elif operator == "==": df = df[df[field] == value]
                elif operator == "!=": df = df[df[field] != value]
        
        elif transform_type == "aggregate":
            group_by = transform.get("group_by", [])
            agg_func = transform.get("function", "sum")
            agg_field = transform.get("field")
            
            if group_by and agg_field:
                if agg_func == "sum":
                    df = df.groupby(group_by)[agg_field].sum().reset_index()
                elif agg_func == "avg":
                    df = df.groupby(group_by)[agg_field].mean().reset_index()
                elif agg_func == "count":
                    df = df.groupby(group_by)[agg_field].count().reset_index()
        
        elif transform_type == "remove_nulls":
            df = df.dropna()
        
        elif transform_type == "deduplicate":
            key_fields = transform.get("key_fields", [])
            if key_fields:
                df = df.drop_duplicates(subset=key_fields)
    
    return df.to_dict('records')

def validate_data(data: List[Dict[str, Any]], rules: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Validate data against quality rules"""
    results = []
    
    for rule in rules:
        rule_type = rule.get("rule_type")
        field = rule.get("field")
        condition = rule.get("condition")
        
        total_records = len(data)
        failed_records = 0
        
        if rule_type == "completeness":
            # Check for null/missing values
            failed_records = sum(1 for record in data if record.get(field) is None or record.get(field) == "")
        
        elif rule_type == "accuracy":
            # Check if values are within acceptable range
            min_val = condition.get("min")
            max_val = condition.get("max")
            for record in data:
                val = record.get(field)
                if val is not None and (val < min_val or val > max_val):
                    failed_records += 1
        
        elif rule_type == "consistency":
            # Check if values match expected format/pattern
            expected_pattern = condition.get("pattern")
            for record in data:
                val = str(record.get(field, ""))
                if expected_pattern and not val.startswith(expected_pattern):
                    failed_records += 1
        
        passed = failed_records == 0
        quality_score = ((total_records - failed_records) / total_records * 100) if total_records > 0 else 0
        
        results.append({
            "rule_id": rule.get("id"),
            "rule_name": rule.get("name"),
            "passed": passed,
            "records_checked": total_records,
            "records_failed": failed_records,
            "quality_score": round(quality_score, 2)
        })
    
    overall_score = sum(r["quality_score"] for r in results) / len(results) if results else 100
    
    return results, {"overall_quality_score": round(overall_score, 2)}

# ==================== API ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "Data Pipeline Engineering Platform API"}

# Data Sources
@api_router.post("/data-sources", response_model=DataSource)
async def create_data_source(source: DataSourceCreate):
    source_obj = DataSource(**source.model_dump())
    doc = source_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.data_sources.insert_one(doc)
    return source_obj

@api_router.get("/data-sources", response_model=List[DataSource])
async def get_data_sources():
    sources = await db.data_sources.find({}, {"_id": 0}).to_list(1000)
    for s in sources:
        if isinstance(s['created_at'], str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return sources

# Pipelines
@api_router.post("/pipelines", response_model=Pipeline)
async def create_pipeline(pipeline: PipelineCreate):
    pipeline_obj = Pipeline(**pipeline.model_dump())
    doc = pipeline_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.pipelines.insert_one(doc)
    return pipeline_obj

@api_router.get("/pipelines", response_model=List[Pipeline])
async def get_pipelines():
    pipelines = await db.pipelines.find({}, {"_id": 0}).to_list(1000)
    for p in pipelines:
        if isinstance(p['created_at'], str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
        if isinstance(p['updated_at'], str):
            p['updated_at'] = datetime.fromisoformat(p['updated_at'])
    return pipelines

@api_router.get("/pipelines/{pipeline_id}", response_model=Pipeline)
async def get_pipeline(pipeline_id: str):
    pipeline = await db.pipelines.find_one({"id": pipeline_id}, {"_id": 0})
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    if isinstance(pipeline['created_at'], str):
        pipeline['created_at'] = datetime.fromisoformat(pipeline['created_at'])
    if isinstance(pipeline['updated_at'], str):
        pipeline['updated_at'] = datetime.fromisoformat(pipeline['updated_at'])
    return pipeline

@api_router.put("/pipelines/{pipeline_id}", response_model=Pipeline)
async def update_pipeline(pipeline_id: str, updates: Dict[str, Any]):
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.pipelines.update_one({"id": pipeline_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return await get_pipeline(pipeline_id)

@api_router.delete("/pipelines/{pipeline_id}")
async def delete_pipeline(pipeline_id: str):
    result = await db.pipelines.delete_one({"id": pipeline_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return {"message": "Pipeline deleted successfully"}

# Pipeline Execution
@api_router.post("/pipelines/{pipeline_id}/execute")
async def execute_pipeline(pipeline_id: str):
    """Execute a pipeline and run ETL process"""
    pipeline = await db.pipelines.find_one({"id": pipeline_id}, {"_id": 0})
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    # Create pipeline run
    run = PipelineRun(
        pipeline_id=pipeline_id,
        pipeline_name=pipeline['name'],
        status="running",
        start_time=datetime.now(timezone.utc),
        logs=[]
    )
    
    try:
        # Step 1: Generate/Ingest data
        run.logs.append({"timestamp": datetime.now(timezone.utc).isoformat(), "level": "INFO", "message": "Starting data ingestion..."})
        raw_data = generate_plant_data(num_records=100)
        run.logs.append({"timestamp": datetime.now(timezone.utc).isoformat(), "level": "INFO", "message": f"Ingested {len(raw_data)} records"})
        
        # Step 2: Apply transformations
        run.logs.append({"timestamp": datetime.now(timezone.utc).isoformat(), "level": "INFO", "message": "Applying transformations..."})
        transformations = pipeline.get('transformations', [])
        transformed_data = apply_transformations(raw_data, transformations)
        run.logs.append({"timestamp": datetime.now(timezone.utc).isoformat(), "level": "INFO", "message": f"Transformed to {len(transformed_data)} records"})
        
        # Step 3: Data quality validation
        run.logs.append({"timestamp": datetime.now(timezone.utc).isoformat(), "level": "INFO", "message": "Running data quality checks..."})
        quality_rules = await db.quality_rules.find({"active": True}, {"_id": 0}).to_list(100)
        validation_results, quality_metrics = validate_data(transformed_data, quality_rules)
        
        # Save quality results
        for result in validation_results:
            quality_result = DataQualityResult(
                pipeline_run_id=run.id,
                **result
            )
            doc = quality_result.model_dump()
            doc['timestamp'] = doc['timestamp'].isoformat()
            await db.quality_results.insert_one(doc)
        
        run.logs.append({"timestamp": datetime.now(timezone.utc).isoformat(), "level": "INFO", "message": f"Quality score: {quality_metrics['overall_quality_score']}%"})
        
        # Step 4: Save processed data
        processed = ProcessedData(
            pipeline_run_id=run.id,
            data=transformed_data[:50],  # Store sample for querying
            metadata={"total_records": len(transformed_data), "quality_metrics": quality_metrics}
        )
        doc = processed.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.processed_data.insert_one(doc)
        
        run.status = "success"
        run.end_time = datetime.now(timezone.utc)
        run.records_processed = len(transformed_data)
        run.metrics = quality_metrics
        run.logs.append({"timestamp": datetime.now(timezone.utc).isoformat(), "level": "SUCCESS", "message": "Pipeline completed successfully"})
        
    except Exception as e:
        run.status = "failed"
        run.end_time = datetime.now(timezone.utc)
        run.error_message = str(e)
        run.logs.append({"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": f"Pipeline failed: {str(e)}"})
    
    # Save pipeline run
    run_doc = run.model_dump()
    run_doc['start_time'] = run_doc['start_time'].isoformat()
    if run_doc['end_time']:
        run_doc['end_time'] = run_doc['end_time'].isoformat()
    await db.pipeline_runs.insert_one(run_doc)
    
    return run

# Pipeline Runs
@api_router.get("/pipeline-runs", response_model=List[PipelineRun])
async def get_pipeline_runs(limit: int = 50):
    runs = await db.pipeline_runs.find({}, {"_id": 0}).sort("start_time", -1).limit(limit).to_list(limit)
    for r in runs:
        if isinstance(r['start_time'], str):
            r['start_time'] = datetime.fromisoformat(r['start_time'])
        if r.get('end_time') and isinstance(r['end_time'], str):
            r['end_time'] = datetime.fromisoformat(r['end_time'])
    return runs

@api_router.get("/pipeline-runs/{run_id}", response_model=PipelineRun)
async def get_pipeline_run(run_id: str):
    run = await db.pipeline_runs.find_one({"id": run_id}, {"_id": 0})
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
    if isinstance(run['start_time'], str):
        run['start_time'] = datetime.fromisoformat(run['start_time'])
    if run.get('end_time') and isinstance(run['end_time'], str):
        run['end_time'] = datetime.fromisoformat(run['end_time'])
    return run

# Data Quality Rules
@api_router.post("/quality-rules", response_model=DataQualityRule)
async def create_quality_rule(rule: DataQualityRuleCreate):
    rule_obj = DataQualityRule(**rule.model_dump())
    doc = rule_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.quality_rules.insert_one(doc)
    return rule_obj

@api_router.get("/quality-rules", response_model=List[DataQualityRule])
async def get_quality_rules():
    rules = await db.quality_rules.find({}, {"_id": 0}).to_list(1000)
    for r in rules:
        if isinstance(r['created_at'], str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return rules

@api_router.put("/quality-rules/{rule_id}", response_model=DataQualityRule)
async def update_quality_rule(rule_id: str, updates: Dict[str, Any]):
    result = await db.quality_rules.update_one({"id": rule_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quality rule not found")
    rule = await db.quality_rules.find_one({"id": rule_id}, {"_id": 0})
    if isinstance(rule['created_at'], str):
        rule['created_at'] = datetime.fromisoformat(rule['created_at'])
    return rule

# Quality Results
@api_router.get("/quality-results")
async def get_quality_results(limit: int = 100):
    results = await db.quality_results.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    for r in results:
        if isinstance(r['timestamp'], str):
            r['timestamp'] = datetime.fromisoformat(r['timestamp'])
    return results

# Analytics
@api_router.post("/analytics/query")
async def execute_query(query_request: Dict[str, Any]):
    """Execute SQL-like queries on processed data"""
    try:
        # Get recent processed data
        processed_data = await db.processed_data.find({}, {"_id": 0}).sort("timestamp", -1).limit(10).to_list(10)
        
        # Combine all data
        all_data = []
        for pd_item in processed_data:
            all_data.extend(pd_item.get('data', []))
        
        if not all_data:
            return {"columns": [], "rows": [], "row_count": 0}
        
        # Convert to DataFrame for easier querying
        df = pd.DataFrame(all_data)
        
        # Simple query execution (support basic operations)
        query_type = query_request.get('type', 'select_all')
        
        if query_type == 'select_all':
            result_df = df
        elif query_type == 'group_by':
            group_field = query_request.get('group_field')
            agg_field = query_request.get('agg_field')
            agg_func = query_request.get('agg_func', 'sum')
            if group_field and agg_field:
                if agg_func == 'sum':
                    result_df = df.groupby(group_field)[agg_field].sum().reset_index()
                elif agg_func == 'avg':
                    result_df = df.groupby(group_field)[agg_field].mean().reset_index()
                elif agg_func == 'count':
                    result_df = df.groupby(group_field)[agg_field].count().reset_index()
            else:
                result_df = df
        else:
            result_df = df
        
        # Limit results
        result_df = result_df.head(100)
        
        return {
            "columns": result_df.columns.tolist(),
            "rows": result_df.to_dict('records'),
            "row_count": len(result_df)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query execution failed: {str(e)}")

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard overview statistics"""
    # Total pipelines
    total_pipelines = await db.pipelines.count_documents({})
    active_pipelines = await db.pipelines.count_documents({"status": "active"})
    
    # Recent runs
    recent_runs = await db.pipeline_runs.find({}, {"_id": 0}).sort("start_time", -1).limit(10).to_list(10)
    for r in recent_runs:
        if isinstance(r['start_time'], str):
            r['start_time'] = datetime.fromisoformat(r['start_time'])
        if r.get('end_time') and isinstance(r['end_time'], str):
            r['end_time'] = datetime.fromisoformat(r['end_time'])
    
    success_count = sum(1 for r in recent_runs if r['status'] == 'success')
    failed_count = sum(1 for r in recent_runs if r['status'] == 'failed')
    running_count = sum(1 for r in recent_runs if r['status'] == 'running')
    
    # Quality scores over time
    quality_results = await db.quality_results.find({}, {"_id": 0}).sort("timestamp", -1).limit(50).to_list(50)
    for qr in quality_results:
        if isinstance(qr['timestamp'], str):
            qr['timestamp'] = datetime.fromisoformat(qr['timestamp'])
    
    avg_quality_score = sum(qr['quality_score'] for qr in quality_results) / len(quality_results) if quality_results else 0
    
    # Data sources
    total_sources = await db.data_sources.count_documents({})
    
    return {
        "total_pipelines": total_pipelines,
        "active_pipelines": active_pipelines,
        "total_sources": total_sources,
        "recent_runs": recent_runs,
        "run_stats": {
            "success": success_count,
            "failed": failed_count,
            "running": running_count
        },
        "avg_quality_score": round(avg_quality_score, 2),
        "quality_trend": quality_results[:20]
    }

# Initialize sample data
@api_router.post("/initialize-sample-data")
async def initialize_sample_data():
    """Initialize sample data sources, pipelines, and quality rules"""
    
    # Clear existing data
    await db.data_sources.delete_many({})
    await db.pipelines.delete_many({})
    await db.quality_rules.delete_many({})
    
    # Create sample data sources
    sources = [
        DataSource(name="Atlanta Plant", type="manufacturing_plant", location="Atlanta, GA", config={"plant_code": "ATL001"}),
        DataSource(name="Chicago Plant", type="manufacturing_plant", location="Chicago, IL", config={"plant_code": "CHI001"}),
        DataSource(name="Los Angeles Plant", type="manufacturing_plant", location="Los Angeles, CA", config={"plant_code": "LA001"})
    ]
    
    for source in sources:
        doc = source.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.data_sources.insert_one(doc)
    
    # Create sample pipelines
    pipelines = [
        Pipeline(
            name="Production Data ETL",
            description="Extract, transform, and load production data from manufacturing plants",
            source_id=sources[0].id,
            transformations=[
                {"type": "remove_nulls"},
                {"type": "filter", "condition": {"field": "quality_score", "operator": ">", "value": 80}}
            ],
            schedule="0 */6 * * *",
            status="active"
        ),
        Pipeline(
            name="Quality Metrics Aggregation",
            description="Aggregate quality metrics by plant and product",
            source_id=sources[1].id,
            transformations=[
                {"type": "aggregate", "group_by": ["plant_id", "product"], "field": "production_volume", "function": "sum"}
            ],
            schedule="0 0 * * *",
            status="active"
        )
    ]
    
    for pipeline in pipelines:
        doc = pipeline.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.pipelines.insert_one(doc)
    
    # Create sample quality rules
    rules = [
        DataQualityRule(
            name="Quality Score Completeness",
            description="Ensure all records have a quality score",
            rule_type="completeness",
            field="quality_score",
            condition={},
            severity="critical"
        ),
        DataQualityRule(
            name="Temperature Range Check",
            description="Temperature must be between 2°C and 8°C",
            rule_type="accuracy",
            field="temperature",
            condition={"min": 2, "max": 8},
            severity="high"
        ),
        DataQualityRule(
            name="Batch ID Format",
            description="Batch ID must start with BATCH_",
            rule_type="consistency",
            field="batch_id",
            condition={"pattern": "BATCH_"},
            severity="medium"
        )
    ]
    
    for rule in rules:
        doc = rule.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.quality_rules.insert_one(doc)
    
    return {"message": "Sample data initialized successfully", "sources": len(sources), "pipelines": len(pipelines), "rules": len(rules)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
