const db = require("../hellpers/service");
const datetimes = require("../hellpers/datetime");
const logger = require('../hellpers/logger');

class User {

    static getClientSecretm() {
        return db.query("SELECT * FROM tbl_client_screet WHERE mode_key = 'dev'")
            .then((result) => result.rows);
    }

    static getTokenExperedDate(client) {
        const now = new Date();
        return db.query("SELECT idx, accesstoken, tokentype, expiresin, datetime, expireddate, scope, client FROM tbl_token WHERE client = $1 AND expireddate >= $2", [client, now])
            .then((result) => {
                return result.rows;
            });
    }

    static getTokenExperedDateToken(token) {
        const currentDate = datetimes.formatDate(new Date());

        const fullQuery = `
        SELECT idx, accesstoken, tokentype, expiresin, datetime, expireddate, scope, client
        FROM tbl_token
        WHERE accesstoken = '${token}' and expireddate >= '${currentDate}'
      `;
      
        return db.query(fullQuery)
            .then((result) => result.rows);
    }

    static async storeTokenSession(req) {
        const data = req.data;
        const { expiresIn, tokenType, accessToken } = data;
        const datetime = new Date();
        const expiredDate = new Date(datetime.getTime() + expiresIn * 1000);

        try {
            const result = await db.query(
                `INSERT INTO tbl_token (accesstoken, tokentype, expiresin, datetime, expireddate, scope, client) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING idx`,
                [accessToken, tokenType, expiresIn, datetime, expiredDate, 'Akses Token Dari BCA', 'bca']
            );

            if (result.rows.length > 0) {
                return accessToken;
            } else {
                throw new Error("No rows were inserted");
            }

        } catch (error) {
            throw error.message;
        }
    }


    static async storeTokenSessionbca(token) {
        const datetime = new Date();
        const expiredDate = new Date(datetime.getTime() + 900 * 1000);

        try {
            const result = await db.query(
                `INSERT INTO tbl_token (accesstoken, tokentype, expiresin, datetime, expireddate, scope, client) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING idx`,
                [token, 'Bearer', 900, datetime, expiredDate, 'Akses Token Untuk BCA', 'Jadin']
            );

            return result.rowCount > 0;
        } catch (error) {
            throw error.message;
        }
    }


    static async storeOrder(req) {


        const token = req.headers['authorization']?.split(' ')[1];
        const timestamp = req.headers['x-timestamp'];
        const signature = req.headers['x-signature'];
        const channelId = req.headers['channel-id'];
        const partnerId = req.headers['x-partner-id'];
        const externalId = req.headers['x-external-id'];
        const requestBody = req.body;
        const env = 'dev';

        const query = `
        INSERT INTO tbl_log_api (
            id, header_token, create_at, header_time_stamp, 
            header_signature, header_channel_id, header_partner_id, 
            header_external_id, body_requestid, body_response, env
        ) VALUES (
            nextval('tbl_log_api_id_seq'::regclass), $1, CURRENT_TIMESTAMP, $2, 
            $3, $4, $5, $6, $7, $8, $9
        )
    `;

        const values = [
            token,            // $1: header_token
            timestamp,        // $2: header_time_stamp
            signature,        // $3: header_signature
            channelId,        // $4: header_channel_id
            partnerId,        // $5: header_partner_id
            externalId,       // $6: header_external_id
            requestBody.requestId,  // $7: body_requestid (dari body request)
            JSON.stringify(requestBody), // $8: body_response (sebagai JSON string)
            env               // $9: env (bisa 'dev' atau 'live')
        ];

        try {
            const result = await db.query(query, values);
            return result;
        } catch (error) {
            logger.info(`Error executing query: ${error}`);
            return false;
        }
    }


    static async getOrderServer() {

        try {
            const query = `
            SELECT 
                id, 
                header_token, 
                create_at AT TIME ZONE 'UTC' AS create_at_utc, 
                header_time_stamp, 
                header_signature, 
                header_channel_id, 
                header_partner_id, 
                header_external_id, 
                body_requestid, 
                body_response, 
                env 
            FROM 
                public.tbl_log_api  
            WHERE 
                create_at >= NOW() - INTERVAL '5 minutes'
            ORDER BY 
                create_at DESC
        `;

            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            throw error;
        }


    }


    static async getValidateHeader(req) {

        const requestBody = req.body;

        const query = `
          SELECT COUNT(*) 
          FROM tbl_log_api 
          WHERE body_requestid = $1
        `;


        try {
            const result = await db.query(query, [requestBody.requestId]);
            return result.rows[0].count;
        } catch (error) {
            logger.log(`model.getValidateHeader() : ${error}`);
            throw error;
        }
    }

    static async storejofinish(req) {

        const { status, message, data } = req;

        if (status === 200) {
            data.forEach(async (item, index) => {

                const sumRequestId = await this.getValidateJo(item.request_id);

                if (sumRequestId == 0) {

                    const sql = `
                        INSERT INTO jo_all_data (
                            id,
                            request_id,
                            complaintid,
                            create_time,
                            type_jo,
                            body,
                            status_jo
                        ) VALUES (
                            nextval('jo_all_data_id_seq'::regclass),
                            $1,
                            $2,
                            CURRENT_TIMESTAMP,
                            $3,
                            $4,
                            $5
                        )
                    `;

                    const values = [
                        item.request_id,
                        item.complaintid,
                        item.tyope_job,
                        item.data,
                        'baru'
                    ];

                    try {
                        const result = await db.query(sql, values);
                        return result;
                    } catch (error) {
                        throw error.message;
                    }
                }
            });
        } else {
            return message;
        }
    }

    static async getValidateJo(request_id) {
        const query = `
          SELECT COUNT(*) 
          FROM jo_all_data 
          WHERE request_id = $1;
        `;
        try {
            const result = await db.query(query, [request_id]);
            return result.rows[0].count;
        } catch (error) {
            throw error;
        }

    }


    static async getAllJoToBca() {

        try {
            const query = `
               SELECT 
                        id, 
                        request_id, 
                        complaintid, 
                        create_time AT TIME ZONE 'UTC' AS create_time_utc, 
                        type_jo, 
                        body, 
                        status_jo 
                    FROM 
                        jo_all_data
                    WHERE 
                        status_jo = 'baru'
                    ORDER BY 
                        create_time DESC
                    LIMIT 100
            `;

            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            logger.log(`model.getAllJoToBca() : ${error}`);
            throw error;
        }

    }


    static async storeHistoryTransaction(requestid, jsonresponsemessage) {
        const datetime = new Date();

        const { rows } = await db.query(
            `SELECT COUNT(*) AS count FROM tbl_log_transaction WHERE requestid = $1`,
            [requestid]
        );

        if (rows[0].count === 0) {
            try {
                await db.query(
                    `INSERT INTO public.tbl_log_transaction (requestid, createdate, jsonresponsemessage) 
                     VALUES ($1, $2, $3)`,
                    [requestid, datetime, jsonresponsemessage]
                );
            } catch (error) {
                throw error.message;
            }
        }
    }

    static async updateJoStatus(requestId, status) {
        try {
            const updateQuery = `
                UPDATE jo_all_data
                SET status_jo = $1 
                WHERE request_id = $2
            `;
    
            const result = await db.query(updateQuery, [status, requestId]);
    
            // Mengecek apakah ada baris yang diperbarui
            // if (result.rowCount > 0) {
            //     console.log(`Status JO untuk request_id ${requestId} berhasil diperbarui.`);
            // } else {
            //     console.log(`Tidak ada JO yang ditemukan dengan request_id ${requestId}.`);
            // }
        } catch (error) {
            throw error;
        }
    }

    static async storeMasterVendor(req) {
        const idvendor = req.body['id'];
        const kode = req.body['code'];
        const namevendor = req.body['name'];
        const statusvendor = req.body['status'];
        const alamatvendor = req.body['address'] || ''; // Optional address field
        const hostUrl = req.get('host');
        const production_mode = hostUrl.includes('localhost') || hostUrl.includes('dev') ? 'DEV' : 'PROD';

        // Validasi input: pastikan semua field penting terisi
        if (!idvendor || !kode || !namevendor || !statusvendor) {
            return false; // Jika salah satu field kosong, kembalikan false
        }

        const checkQuery = `
            SELECT 1 FROM tbl_vendor_master WHERE idvendor = $1;
        `;

        try {
            // Cek apakah vendor dengan idvendor sudah ada
            const checkResult = await db.query(checkQuery, [idvendor]);
            if (checkResult.rowCount > 0) {
                return false; // Jika vendor sudah ada, kembalikan false
            }

            // Jika tidak ada vendor dengan idvendor yang sama, lakukan insert
            const insertQuery = `
                INSERT INTO tbl_vendor_master (
                    idx, idvendor, namevendor, alamatvendor, 
                    kode, statusvendor, production_mode
                ) VALUES (
                    nextval('tbl_vendor_master_idx_seq'::regclass), $1, $2, 
                    $3, $4, $5, $6
                );
            `;

            const values = [
                idvendor,
                namevendor,
                alamatvendor,
                kode,
                statusvendor,
                production_mode
            ];

            const insertResult = await db.query(insertQuery, values);

            // Memeriksa hasil query dengan if statement
            if (insertResult.rowCount > 0) {
                return true; // Jika insert berhasil
            } else {
                return false; // Jika insert gagal
            }
        } catch (error) {
            console.error('Error inserting vendor:', error);
            return false; // Jika terjadi error, kembalikan false
        }
    }

    static async updateMasterVendor(req) {
        const idvendor = req.body['id'];
        const kode = req.body['code'];
        const namevendor = req.body['name'];
        const statusvendor = req.body['status'];
        const alamatvendor = req.body['address'] || ''; // Optional address field
        const hostUrl = req.get('host');
        const production_mode = hostUrl.includes('localhost') || hostUrl.includes('dev') ? 'DEV' : 'PROD';

        // Validasi input: pastikan ID vendor dan field penting terisi
        // if (!idvendor || !kode || !namevendor || !statusvendor) {
        //     return false; // Kembalikan false jika salah satu field penting kosong
        // }

        const checkQuery = `SELECT 1 FROM tbl_vendor_master WHERE idvendor = $1`;

        try {
            // Cek apakah vendor dengan idvendor yang diberikan ada
            const checkResult = await db.query(checkQuery, [idvendor]);

            if (checkResult.rowCount === 0) {
                return false; // Jika vendor tidak ditemukan, kembalikan false
            }

            // Jika vendor ditemukan, lakukan update
            const updateQuery = `
                UPDATE tbl_vendor_master 
                SET 
                    namevendor = $1,
                    alamatvendor = $2,
                    kode = $3,
                    statusvendor = $4,
                    production_mode = $5
                WHERE idvendor = $6;
            `;

            const updateValues = [
                namevendor,
                alamatvendor,
                kode,
                statusvendor,
                production_mode,
                idvendor
            ];

            const updateResult = await db.query(updateQuery, updateValues);

            // Memeriksa hasil query dengan if statement
            if (updateResult.rowCount > 0) {
                return true; // Jika update berhasil
            } else {
                return false; // Jika tidak ada baris yang diperbarui
            }
            
        } catch (error) {
            return false; // Jika terjadi error, kembalikan false
        }
    }

    static async postNonCluster(req) {
        const requestId = req.body['requestId'];
        const query = `SELECT request_id FROM jo_all_data WHERE request_id = $1`;
        const values = [requestId];
        const hostUrl = req.get('host');
        const production_mode = hostUrl.includes('localhost') || hostUrl.includes('dev') ? 'dev' : 'prod';
        const queryGetClientData = `SELECT client_id,url,clientsecret,apikey,apisecret,partnerid,externalid,channelid FROM tbl_client_screet WHERE mode_key = $1`;
        const getToken = `select accesstoken from tbl_token order by idx desc limit 1`;
        try {
            const result = await db.query(query, values);
            if (result.rowCount > 0) {
                const resultClientData = await db.query(queryGetClientData,[production_mode]);
                const resultToken = await db.query(getToken);
                return {
                    code: '200M200',
                    message: 'Successful',
                    data: resultClientData.rows,
                    token : resultToken.rows
                };
            } else {
                return {
                    code: '403M203',
                    message: 'Suspected Fraud'
                };
            }
        } catch (error) {
            return {
                code: '504M200',
                message: 'Timeout'
            };
        }
    }
    
    static async valNonCluster(request_id){

        const checkQuery = `SELECT 1 FROM tbl_log_api WHERE body_requestid = $1`;
        try {
            const checkResult = await db.query(checkQuery, [request_id]);
            return checkResult.rowCount;
        } catch (error) {
            return 0;
        }

    }



}

module.exports = User;
