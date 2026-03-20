package router

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func ConnectDB(ctx context.Context, dbvar string) (*pgxpool.Pool, error) {

	//
	// Connecting to the database

	ctx30, cancel30 := context.WithTimeout(ctx, 30*time.Second)
	defer cancel30()

	dbConfig, err := pgxpool.ParseConfig(os.Getenv(dbvar))
	if err != nil {
		return nil, fmt.Errorf("Unable to parse database config: %v\n", err)
	}

	// Supabase poolers do not work reliably with prepared statement caching.
	dbConfig.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	dbpool, err := pgxpool.NewWithConfig(ctx30, dbConfig)

	if err != nil {
		return nil, fmt.Errorf("Unable to connect to database: %v\n", err)
	}

	//
	// Database check

	ctx5, cancel5 := context.WithTimeout(ctx, 5*time.Second)
	defer cancel5()

	err = dbpool.Ping(ctx5)

	if err != nil {
		dbpool.Close()
		return nil, fmt.Errorf("Database unreachable: %v\n", err)
	}

	return dbpool, nil
}
